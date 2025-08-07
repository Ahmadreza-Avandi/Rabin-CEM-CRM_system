'use client';

import React, { useState, useEffect } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, IconButton, Typography, Fade } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import { Menu as MenuIcon, Brightness4, Brightness7 } from '@mui/icons-material';
import { getMuiTheme } from '@/lib/mui-theme';
import { rtlCache } from '@/lib/rtl-theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { ResponsiveSidebar } from './responsive-sidebar';
import { Header } from './header';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
    const { theme: nextTheme, setTheme, systemTheme } = useNextTheme();
    const [mounted, setMounted] = useState(false);

    // تشخیص تم فعلی
    const currentTheme = nextTheme === 'system' ? systemTheme : nextTheme;
    const isDarkMode = currentTheme === 'dark';
    const muiTheme = getMuiTheme(isDarkMode);

    const {
        isMobile,
        isTablet,
        isDesktop,
        drawerOpen,
        setDrawerOpen,
        toggleDrawer,
        drawerVariant,
        shouldShowMobileMenuButton,
        drawerWidth,
        collapsedDrawerWidth,
        isDrawerCollapsed,
        setIsDrawerCollapsed,
    } = useResponsiveLayout();

    useEffect(() => {
        setMounted(true);
    }, []);

    // تابع تغییر تم
    const toggleTheme = () => {
        setTheme(isDarkMode ? 'light' : 'dark');
    };

    if (!mounted) {
        return null;
    }

    return (
        <CacheProvider value={rtlCache}>
            <ThemeProvider theme={muiTheme}>
                <CssBaseline />
                <Box sx={{
                    display: 'flex',
                    minHeight: '100vh',
                    overflow: 'hidden',
                    position: 'relative',
                }}>
                    {/* Sidebar با پوزیشن ثابت */}
                    <Box sx={{
                        position: isDesktop ? 'fixed' : 'relative',
                        right: 0,
                        top: 0,
                        height: '100vh',
                        zIndex: (theme) => theme.zIndex.drawer,
                    }}>
                        <ResponsiveSidebar
                            drawerOpen={drawerOpen}
                            onDrawerClose={() => setDrawerOpen(false)}
                            drawerVariant={drawerVariant}
                            drawerWidth={drawerWidth}
                            isCollapsed={isDrawerCollapsed}
                            onToggleCollapse={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
                        />
                    </Box>

                    {/* Main Content */}
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            minHeight: '100vh',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            marginRight: {
                                xs: 0,
                                lg: isDesktop ? (isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth) : 0
                            },
                            width: {
                                xs: '100%',
                                lg: isDesktop ? `calc(100% - ${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` : '100%'
                            },
                            transition: theme => theme.transitions.create(['margin', 'width'], {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.leavingScreen,
                            }),
                        }}
                    >
                        {/* Header */}
                        <AppBar
                            position="sticky"
                            elevation={0}
                            sx={{
                                zIndex: (theme) => theme.zIndex.drawer - 1,
                                bgcolor: 'background.default',
                                borderBottom: 1,
                                borderColor: 'divider',
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            <Toolbar>
                                {shouldShowMobileMenuButton && (
                                    <IconButton
                                        edge="start"
                                        color="inherit"
                                        aria-label="open drawer"
                                        onClick={toggleDrawer}
                                        sx={{ ml: 2 }}
                                    >
                                        <MenuIcon />
                                    </IconButton>
                                )}

                                <Box sx={{ flexGrow: 1 }}>
                                    <Header />
                                </Box>

                                <IconButton color="inherit" onClick={toggleTheme}>
                                    {isDarkMode ? <Brightness7 /> : <Brightness4 />}
                                </IconButton>
                            </Toolbar>
                        </AppBar>

                        {/* Content Area */}
                        <Box
                            sx={{
                                flexGrow: 1,
                                p: { xs: 2, md: 3 },
                                overflow: 'auto',
                                bgcolor: 'background.default',
                            }}
                        >
                            <Fade in={true}>
                                <div>
                                    {children}
                                </div>
                            </Fade>
                        </Box>
                    </Box>
                </Box>
            </ThemeProvider>
        </CacheProvider>
    );
};
