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

// GET /api/projects/members - Get project members
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

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('project_id');

        if (!projectId) {
            return NextResponse.json(
                { success: false, message: 'شناسه پروژه الزامی است' },
                { status: 400 }
            );
        }

        // بررسی دسترسی به پروژه
        const projectAccess = await executeQuery(`
      SELECT p.id, pm.user_id, pm.role as user_role
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
      WHERE p.id = ? AND (p.manager_id = ? OR p.created_by = ? OR pm.user_id = ?)
    `, [userId, projectId, userId, userId, userId]);

        if (projectAccess.length === 0) {
            return NextResponse.json(
                { success: false, message: 'شما دسترسی به این پروژه ندارید' },
                { status: 403 }
            );
        }

        // دریافت اعضای پروژه
        const members = await executeQuery(`
      SELECT 
        pm.*,
        u.name,
        u.email,
        u.role as system_role,
        u.avatar,
        u.status,
        assigned_by_user.name as assigned_by_name
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      LEFT JOIN users assigned_by_user ON pm.assigned_by = assigned_by_user.id
      WHERE pm.project_id = ?
      ORDER BY pm.assigned_at DESC
    `, [projectId]);

        return NextResponse.json({
            success: true,
            data: members
        });

    } catch (error) {
        console.error('Get project members API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت اعضای پروژه' },
            { status: 500 }
        );
    }
}

// POST /api/projects/members - Add member to project
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

        const body = await req.json();
        const { project_id, user_id, role = 'member' } = body;

        if (!project_id || !user_id) {
            return NextResponse.json(
                { success: false, message: 'شناسه پروژه و کاربر الزامی است' },
                { status: 400 }
            );
        }

        // بررسی دسترسی - فقط مدیر پروژه، سازنده یا مدیران کل می‌توانند عضو اضافه کنند
        const projectInfo = await executeQuery(`
      SELECT p.*, u.role as user_system_role
      FROM projects p
      JOIN users u ON u.id = ?
      WHERE p.id = ? AND (p.manager_id = ? OR p.created_by = ? OR u.role IN ('ceo', 'مدیر', 'sales_manager', 'مدیر فروش', 'admin'))
    `, [userId, project_id, userId, userId]);

        if (projectInfo.length === 0) {
            return NextResponse.json(
                { success: false, message: 'شما دسترسی اضافه کردن عضو به این پروژه را ندارید' },
                { status: 403 }
            );
        }

        // بررسی وجود کاربر
        const userExists = await executeQuery(
            'SELECT id, name FROM users WHERE id = ? AND status = "active"',
            [user_id]
        );

        if (userExists.length === 0) {
            return NextResponse.json(
                { success: false, message: 'کاربر یافت نشد' },
                { status: 400 }
            );
        }

        // بررسی اینکه کاربر قبلاً عضو نباشد
        const existingMember = await executeQuery(
            'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
            [project_id, user_id]
        );

        if (existingMember.length > 0) {
            return NextResponse.json(
                { success: false, message: 'این کاربر قبلاً عضو پروژه است' },
                { status: 400 }
            );
        }

        const membershipId = generateUUID();
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await executeSingle(`
      INSERT INTO project_members (id, project_id, user_id, role, assigned_by, assigned_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [membershipId, project_id, user_id, role, userId, now]);

        return NextResponse.json({
            success: true,
            message: 'عضو با موفقیت به پروژه اضافه شد',
            data: { id: membershipId }
        });

    } catch (error) {
        console.error('Add project member API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در اضافه کردن عضو به پروژه' },
            { status: 500 }
        );
    }
}

// PUT /api/projects/members - Update member role
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
        const { membership_id, role } = body;

        if (!membership_id || !role) {
            return NextResponse.json(
                { success: false, message: 'شناسه عضویت و نقش الزامی است' },
                { status: 400 }
            );
        }

        // بررسی وجود عضویت و دسترسی
        const membershipInfo = await executeQuery(`
      SELECT pm.*, p.manager_id, p.created_by, u.role as user_system_role
      FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      JOIN users u ON u.id = ?
      WHERE pm.id = ? AND (p.manager_id = ? OR p.created_by = ? OR u.role IN ('ceo', 'مدیر', 'sales_manager', 'مدیر فروش', 'admin'))
    `, [userId, membership_id, userId, userId]);

        if (membershipInfo.length === 0) {
            return NextResponse.json(
                { success: false, message: 'عضویت یافت نشد یا شما دسترسی ویرایش ندارید' },
                { status: 404 }
            );
        }

        await executeSingle(
            'UPDATE project_members SET role = ? WHERE id = ?',
            [role, membership_id]
        );

        return NextResponse.json({
            success: true,
            message: 'نقش عضو با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Update project member API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در به‌روزرسانی نقش عضو' },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/members - Remove member from project
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
        const membershipId = searchParams.get('membership_id');

        if (!membershipId) {
            return NextResponse.json(
                { success: false, message: 'شناسه عضویت الزامی است' },
                { status: 400 }
            );
        }

        // بررسی وجود عضویت و دسترسی
        const membershipInfo = await executeQuery(`
      SELECT pm.*, p.manager_id, p.created_by, u.role as user_system_role
      FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      JOIN users u ON u.id = ?
      WHERE pm.id = ? AND (p.manager_id = ? OR p.created_by = ? OR u.role IN ('ceo', 'مدیر', 'sales_manager', 'مدیر فروش', 'admin'))
    `, [userId, membershipId, userId, userId]);

        if (membershipInfo.length === 0) {
            return NextResponse.json(
                { success: false, message: 'عضویت یافت نشد یا شما دسترسی حذف ندارید' },
                { status: 404 }
            );
        }

        await executeSingle('DELETE FROM project_members WHERE id = ?', [membershipId]);

        return NextResponse.json({
            success: true,
            message: 'عضو با موفقیت از پروژه حذف شد'
        });

    } catch (error) {
        console.error('Remove project member API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در حذف عضو از پروژه' },
            { status: 500 }
        );
    }
}