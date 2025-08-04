import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// Generate UUID function
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// GET /api/projects - Get all projects
export async function GET(req: NextRequest) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        // Get current user info
        const currentUsers = await executeQuery(`
      SELECT id, name, email, role, status 
      FROM users 
      WHERE id = ? AND status = 'active'
    `, [userId]);

        if (currentUsers.length === 0) {
            return NextResponse.json(
                { success: false, message: 'کاربر یافت نشد' },
                { status: 404 }
            );
        }

        const user = currentUsers[0];
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = `
      SELECT 
        p.*,
        c.name as customer_name,
        u1.name as manager_name,
        u2.name as created_by_name,
        COUNT(DISTINCT pm.user_id) as members_count,
        COUNT(DISTINCT t.id) as tasks_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks_count
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u1 ON p.manager_id = u1.id
      LEFT JOIN users u2 ON p.created_by = u2.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE 1=1
    `;

        const params: any[] = [];

        // اگر کاربر مدیر نیست، فقط پروژه‌هایی که عضو آن‌هاست یا مدیر آن‌هاست را ببیند
        const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش', 'admin'].includes(user.role);
        if (!isManager) {
            query += ` AND (p.manager_id = ? OR pm.user_id = ?)`;
            params.push(userId, userId);
        }

        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }

        if (priority) {
            query += ' AND p.priority = ?';
            params.push(priority);
        }

        query += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const projects = await executeQuery(query, params);

        return NextResponse.json({
            success: true,
            data: projects
        });

    } catch (error) {
        console.error('Get projects API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت پروژه‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        // Get current user info
        const currentUsers = await executeQuery(`
      SELECT id, name, email, role, status 
      FROM users 
      WHERE id = ? AND status = 'active'
    `, [userId]);

        if (currentUsers.length === 0) {
            return NextResponse.json(
                { success: false, message: 'کاربر یافت نشد' },
                { status: 404 }
            );
        }

        const user = currentUsers[0];

        // بررسی دسترسی - فقط مدیران می‌توانند پروژه ایجاد کنند
        const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش', 'admin'].includes(user.role);
        if (!isManager) {
            return NextResponse.json(
                { success: false, message: 'شما دسترسی ایجاد پروژه ندارید' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const {
            name,
            description,
            customer_id,
            manager_id,
            priority = 'medium',
            budget,
            start_date,
            end_date,
            color = '#3B82F6',
            tags = [],
            members = []
        } = body;

        // Validation
        if (!name || !customer_id) {
            return NextResponse.json(
                { success: false, message: 'نام پروژه و مشتری الزامی است' },
                { status: 400 }
            );
        }

        // بررسی وجود مشتری
        const customerExists = await executeQuery(
            'SELECT id FROM customers WHERE id = ?',
            [customer_id]
        );

        if (customerExists.length === 0) {
            return NextResponse.json(
                { success: false, message: 'مشتری یافت نشد' },
                { status: 400 }
            );
        }

        // بررسی وجود مدیر پروژه (اگر مشخص شده)
        if (manager_id) {
            const managerExists = await executeQuery(
                'SELECT id FROM users WHERE id = ? AND status = "active"',
                [manager_id]
            );

            if (managerExists.length === 0) {
                return NextResponse.json(
                    { success: false, message: 'مدیر پروژه یافت نشد' },
                    { status: 400 }
                );
            }
        }

        const projectId = generateUUID();
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // ایجاد پروژه
        await executeSingle(`
      INSERT INTO projects (
        id, customer_id, name, description, priority, budget,
        start_date, end_date, manager_id, created_by, tags, color,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            projectId, customer_id, name, description || null, priority, budget || null,
            start_date || null, end_date || null, manager_id || null, userId,
            JSON.stringify(tags), color, now, now
        ]);

        // اضافه کردن اعضای پروژه
        if (members && members.length > 0) {
            for (const memberId of members) {
                // بررسی وجود کاربر
                const memberExists = await executeQuery(
                    'SELECT id FROM users WHERE id = ? AND status = "active"',
                    [memberId]
                );

                if (memberExists.length > 0) {
                    const membershipId = generateUUID();
                    await executeSingle(`
            INSERT INTO project_members (id, project_id, user_id, role, assigned_by, assigned_at)
            VALUES (?, ?, ?, 'member', ?, ?)
          `, [membershipId, projectId, memberId, userId, now]);
                }
            }
        }

        // اگر مدیر پروژه مشخص شده، او را هم به عنوان عضو اضافه کن
        if (manager_id && !members.includes(manager_id)) {
            const managerMembershipId = generateUUID();
            await executeSingle(`
        INSERT INTO project_members (id, project_id, user_id, role, assigned_by, assigned_at)
        VALUES (?, ?, ?, 'manager', ?, ?)
      `, [managerMembershipId, projectId, manager_id, userId, now]);
        }

        return NextResponse.json({
            success: true,
            message: 'پروژه با موفقیت ایجاد شد',
            data: { id: projectId }
        });

    } catch (error) {
        console.error('Create project API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ایجاد پروژه' },
            { status: 500 }
        );
    }
}

// PUT /api/projects - Update a project
export async function PUT(req: NextRequest) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'شناسه پروژه الزامی است' },
                { status: 400 }
            );
        }

        // بررسی وجود پروژه و دسترسی
        const existingProject = await executeQuery(`
      SELECT p.*, pm.role as user_role
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
      WHERE p.id = ?
    `, [userId, id]);

        if (existingProject.length === 0) {
            return NextResponse.json(
                { success: false, message: 'پروژه یافت نشد' },
                { status: 404 }
            );
        }

        const project = existingProject[0];

        // بررسی دسترسی - فقط مدیر پروژه، سازنده یا مدیران کل می‌توانند ویرایش کنند
        const currentUsers = await executeQuery(`
      SELECT role FROM users WHERE id = ? AND status = 'active'
    `, [userId]);

        const isSystemManager = currentUsers.length > 0 &&
            ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش', 'admin'].includes(currentUsers[0].role);
        const isProjectManager = project.manager_id === userId;
        const isCreator = project.created_by === userId;
        const isProjectMember = project.user_role === 'manager';

        if (!isSystemManager && !isProjectManager && !isCreator && !isProjectMember) {
            return NextResponse.json(
                { success: false, message: 'شما دسترسی ویرایش این پروژه را ندارید' },
                { status: 403 }
            );
        }

        // Build update query dynamically
        const allowedFields = [
            'name', 'description', 'status', 'priority', 'budget', 'spent',
            'start_date', 'end_date', 'actual_start_date', 'actual_end_date',
            'progress', 'manager_id', 'tags', 'color'
        ];

        const updateFields = [];
        const updateValues = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                if (key === 'tags') {
                    updateValues.push(JSON.stringify(value));
                } else {
                    updateValues.push(value);
                }
            }
        }

        if (updateFields.length === 0) {
            return NextResponse.json(
                { success: false, message: 'هیچ فیلد قابل به‌روزرسانی ارسال نشده است' },
                { status: 400 }
            );
        }

        updateFields.push('updated_at = ?');
        updateValues.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
        updateValues.push(id);

        await executeSingle(
            `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        return NextResponse.json({
            success: true,
            message: 'پروژه با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Update project API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در به‌روزرسانی پروژه' },
            { status: 500 }
        );
    }
}

// DELETE /api/projects - Delete a project
export async function DELETE(req: NextRequest) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'شناسه پروژه الزامی است' },
                { status: 400 }
            );
        }

        // بررسی وجود پروژه و دسترسی
        const existingProject = await executeQuery(`
      SELECT * FROM projects WHERE id = ?
    `, [id]);

        if (existingProject.length === 0) {
            return NextResponse.json(
                { success: false, message: 'پروژه یافت نشد' },
                { status: 404 }
            );
        }

        const project = existingProject[0];

        // بررسی دسترسی - فقط سازنده یا مدیران کل می‌توانند حذف کنند
        const currentUsers = await executeQuery(`
      SELECT role FROM users WHERE id = ? AND status = 'active'
    `, [userId]);

        const isSystemManager = currentUsers.length > 0 &&
            ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش', 'admin'].includes(currentUsers[0].role);
        const isCreator = project.created_by === userId;

        if (!isSystemManager && !isCreator) {
            return NextResponse.json(
                { success: false, message: 'شما دسترسی حذف این پروژه را ندارید' },
                { status: 403 }
            );
        }

        // حذف پروژه (اعضا و وظایف مرتبط به صورت خودکار حذف می‌شوند)
        await executeSingle('DELETE FROM projects WHERE id = ?', [id]);

        return NextResponse.json({
            success: true,
            message: 'پروژه با موفقیت حذف شد'
        });

    } catch (error) {
        console.error('Delete project API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در حذف پروژه' },
            { status: 500 }
        );
    }
}