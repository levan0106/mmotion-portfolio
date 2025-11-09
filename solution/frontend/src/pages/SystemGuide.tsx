import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Drawer,
  IconButton,
  ListItemButton,
  Tooltip,
  Typography,
  List,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Home as HomeIcon,
  Edit as EditIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Menu as MenuIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import OverviewSection from '../components/SystemGuide/OverviewSection';
import FeaturesSection from '../components/SystemGuide/FeaturesSection';
import UseCasesSection from '../components/SystemGuide/UseCasesSection';
import PermissionsSection from '../components/SystemGuide/PermissionsSection';
import DetailedGuideSection from '../components/SystemGuide/DetailedGuideSection';
import AdvancedFeaturesSection from '../components/SystemGuide/AdvancedFeaturesSection';
import GettingStartedSection from '../components/SystemGuide/GettingStartedSection';

const SystemGuide: React.FC = () => {
  const [tocOpen, setTocOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [isManualClick, setIsManualClick] = useState(false);

  const toggleToc = () => {
    setTocOpen(!tocOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start', 
        inline: 'nearest' 
      });
    }
  };

  const handleSubsectionClick = (sectionId: string) => {
    // Mark as manual click to prevent scroll detection conflicts
    setIsManualClick(true);
    
    // Set active section immediately for better UX
    setActiveSection(sectionId);
    scrollToSection(sectionId);
    setTocOpen(false); // Close mobile drawer
    
    // Reset manual click flag after scroll completes
    setTimeout(() => setIsManualClick(false), 1000);
  };

  const handleSectionClick = (sectionId: string) => {
    // Mark as manual click to prevent scroll detection conflicts
    setIsManualClick(true);
    
    // Set active section immediately for better UX
    setActiveSection(sectionId);
    
    // Accordion behavior: only one section can be expanded at a time
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        // If clicking on already expanded section, collapse it
        newSet.delete(sectionId);
      } else {
        // If clicking on collapsed section, expand it and close others
        newSet.clear();
        newSet.add(sectionId);
      }
      return newSet;
    });
    
    // Also scroll to the section
    scrollToSection(sectionId);
    
    // Reset manual click flag after scroll completes
    setTimeout(() => setIsManualClick(false), 1000);
  };

  const tableOfContents = [
    { id: 'overview', title: 'Tổng quan', icon: <HomeIcon />, sections: [
      { id: 'workflow', title: 'Quy trình hoạt động cơ bản' },
      { id: 'features', title: 'Tính năng chính' },
      { id: 'use-cases', title: 'Trường hợp sử dụng' },
      { id: 'permissions', title: 'Hệ thống phân quyền' }
    ]},
    { id: 'detailed-guide', title: 'Hướng dẫn chi tiết', icon: <EditIcon />, sections: [
      { id: 'portfolio-creation', title: 'Tạo Portfolio Chi Tiết' },
      { id: 'transaction-creation', title: 'Tạo Giao Dịch' },
      { id: 'tradings-management', title: 'Quản Lý Giao Dịch' },
      { id: 'cash-flow', title: 'Quản lý dòng tiền' }
    ]},
    { id: 'advanced-features', title: 'Tính năng nâng cao', icon: <AnalyticsIcon />, sections: [
      { id: 'performance-analysis', title: 'Phân tích hiệu suất' },
      { id: 'risk-management', title: 'Quản lý rủi ro' },
      { id: 'sharing-reports', title: 'Chia sẻ và báo cáo' }
    ]},
    { id: 'getting-started', title: 'Bắt đầu sử dụng', icon: <CheckCircleIcon />, sections: [
      { id: 'for-managers', title: 'Cho nhà quản lý' },
      { id: 'for-customers', title: 'Cho khách hàng' }
    ]}
  ];

  // Track scroll position to highlight active section
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      // Skip scroll detection if manual click is in progress
      if (isManualClick) return;
      
      // Debounce scroll events to avoid conflicts with manual clicks
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const sections = tableOfContents.flatMap(section => [
          section.id,
          ...section.sections.map(sub => sub.id)
        ]);
        
        let currentSection = 'overview';
        let bestMatch = { sectionId: 'overview', distance: Infinity };
        
        // Find the section that's closest to the top of the viewport
        for (const sectionId of sections) {
          const element = document.getElementById(sectionId);
          if (element) {
            const rect = element.getBoundingClientRect();
            const distanceFromTop = Math.abs(rect.top);
            
            // If section is visible and closer to top
            if (rect.top <= window.innerHeight && rect.bottom >= 0) {
              // Prefer main sections over subsections when they're close
              const isMainSection = tableOfContents.some(section => section.id === sectionId);
              const adjustedDistance = isMainSection ? distanceFromTop * 0.8 : distanceFromTop;
              
              if (adjustedDistance < bestMatch.distance) {
                bestMatch = { sectionId, distance: adjustedDistance };
              }
            }
          }
        }
        
        currentSection = bestMatch.sectionId;
        setActiveSection(currentSection);
        
        // Auto-expand section if a subsection is active (accordion behavior)
        const parentSection = tableOfContents.find(section => 
          section.sections.some(sub => sub.id === currentSection)
        );
        if (parentSection && !expandedSections.has(parentSection.id)) {
          setExpandedSections(new Set([parentSection.id]));
        }
      }, 50); // Reduced debounce for better responsiveness
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [expandedSections, isManualClick]);

  const renderAllContent = () => {
    return (
      <>
        <OverviewSection />
        <FeaturesSection />
        <UseCasesSection />
        <PermissionsSection />
        <DetailedGuideSection />
        <AdvancedFeaturesSection />
        <GettingStartedSection />
      </>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Fixed TOC Sidebar */}
      <Box sx={{
        width: { xs: 0, md: 280 },
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        zIndex: 1
      }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuIcon />
            Mục lục
          </Typography>
        </Box>
        
        <List dense sx={{ p: 1 }}>
          {tableOfContents.map((section) => {
            const isSectionActive = activeSection === section.id;
            const hasActiveSubsection = section.sections.some(sub => sub.id === activeSection);
            const isExpanded = expandedSections.has(section.id) || isSectionActive || hasActiveSubsection;
            
            return (
              <React.Fragment key={section.id}>
                <ListItemButton 
                  onClick={() => handleSectionClick(section.id)}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 0.5,
                    bgcolor: isSectionActive ? 'primary.main' : 'transparent',
                    color: isSectionActive ? 'white' : 'inherit',
                    '&:hover': {
                      bgcolor: isSectionActive ? 'primary.dark' : 'primary.main',
                      color: 'white'
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isSectionActive ? 'white' : 'primary.main', 
                    minWidth: 36 
                  }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={section.title}
                    primaryTypographyProps={{ 
                      fontWeight: isSectionActive ? 600 : 500,
                      fontSize: '0.9rem'
                    }}
                  />
                </ListItemButton>
                
                <Box sx={{ pl: 4, mb: 1, display: isExpanded ? 'block' : 'none' }}>
                  {section.sections.map((subsection) => {
                    const isSubsectionActive = activeSection === subsection.id;
                    return (
                      <ListItemButton 
                        key={subsection.id}
                        onClick={() => handleSubsectionClick(subsection.id)}
                        sx={{ 
                          py: 0.5, 
                          px: 1, 
                          borderRadius: 1,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          bgcolor: isSubsectionActive ? 'primary.light' : 'transparent',
                          color: isSubsectionActive ? 'primary.contrastText' : 'inherit',
                          '&:hover': {
                            bgcolor: isSubsectionActive ? 'primary.main' : 'action.hover'
                          }
                        }}
                      >
                        <ListItemText 
                          primary={subsection.title}
                          primaryTypographyProps={{ 
                            fontSize: '0.8rem',
                            fontWeight: isSubsectionActive ? 600 : 400
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </Box>
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
    <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header with Mobile TOC Toggle */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
        <ResponsiveTypography variant="pageTitle" component="h1" gutterBottom>
          Cách hoạt động của hệ thống
        </ResponsiveTypography>
        <ResponsiveTypography variant="pageSubtitle" color="text.secondary" paragraph>
          Hướng dẫn chi tiết về cách sử dụng hệ thống quản lý danh mục đầu tư
        </ResponsiveTypography>
      </Box>

            {/* Mobile TOC Toggle Button */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Tooltip title="Mục lục">
                <IconButton
                  onClick={toggleToc}
                  sx={{
                    bgcolor: 'primary.main',
                  color: 'white', 
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Content Area */}
          <Box data-content-area>
            {renderAllContent()}
          </Box>
        </Container>
      </Box>

      {/* Mobile TOC Drawer */}
      <Drawer
        anchor="right"
        open={tocOpen}
        onClose={toggleToc}
                  sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: '100%',
            p: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Mục lục
          </Typography>
          <IconButton onClick={toggleToc} size="small">
            <ArrowForwardIcon />
          </IconButton>
        </Box>
        
                  <List dense>
          {tableOfContents.map((section) => {
            const isSectionActive = activeSection === section.id;
            const hasActiveSubsection = section.sections.some(sub => sub.id === activeSection);
            const isExpanded = expandedSections.has(section.id) || isSectionActive || hasActiveSubsection;
            
            return (
              <React.Fragment key={section.id}>
                <ListItemButton 
                  onClick={() => {
                    handleSectionClick(section.id);
                    setTocOpen(false);
                  }}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 0.5,
                    bgcolor: isSectionActive ? 'primary.main' : 'transparent',
                    color: isSectionActive ? 'white' : 'inherit',
                    '&:hover': {
                      bgcolor: isSectionActive ? 'primary.dark' : 'primary.main',
                      color: 'white'
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isSectionActive ? 'white' : 'primary.main' 
                  }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={section.title}
                    primaryTypographyProps={{ 
                      fontWeight: isSectionActive ? 600 : 500,
                      fontSize: '0.9rem'
                    }}
                  />
                </ListItemButton>
                
                <Box sx={{ pl: 4, mb: 1, display: isExpanded ? 'block' : 'none' }}>
                  {section.sections.map((subsection) => {
                    const isSubsectionActive = activeSection === subsection.id;
                    return (
                      <ListItemButton 
                        key={subsection.id}
                        onClick={() => handleSubsectionClick(subsection.id)}
                              sx={{
                          py: 0.5, 
                          px: 1, 
                          borderRadius: 1,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          bgcolor: isSubsectionActive ? 'primary.light' : 'transparent',
                          color: isSubsectionActive ? 'primary.contrastText' : 'inherit',
                          '&:hover': {
                            bgcolor: isSubsectionActive ? 'primary.main' : 'action.hover'
                          }
                        }}
                      >
                        <ListItemText 
                          primary={subsection.title}
                          primaryTypographyProps={{ 
                            fontSize: '0.8rem',
                            fontWeight: isSubsectionActive ? 600 : 400
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </Box>
              </React.Fragment>
            );
          })}
        </List>
      </Drawer>
                </Box>
  );
};

export default SystemGuide;