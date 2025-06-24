import React, { ReactNode, useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardActions,
  Typography,
  Box,
  Avatar,
  Divider,
  Skeleton,
  IconButton,
  Tooltip,
  useTheme as useMuiTheme,
  Collapse,
  Badge
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme } from '../../contexts/ThemeContext';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconColor?: string;
  action?: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
  expandableContent?: ReactNode;
  isLoading?: boolean;
  elevation?: number;
  minHeight?: number;
  onClick?: () => void;
  onRefresh?: () => void;
  headerDivider?: boolean;
  footerDivider?: boolean;
  cardStyles?: React.CSSProperties;
  badgeContent?: number;
  showBadge?: boolean;
  badgeColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  variant?: 'outlined' | 'elevation';
  highlight?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  action,
  content,
  footer,
  expandableContent,
  isLoading = false,
  elevation = 1,
  minHeight,
  onClick,
  onRefresh,
  headerDivider = false,
  footerDivider = true,
  cardStyles,
  badgeContent,
  showBadge = false,
  badgeColor = 'error',
  variant = 'elevation',
  highlight = false,
}) => {
  const muiTheme = useMuiTheme();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  const defaultIconColor = iconColor || theme.primaryColor || muiTheme.palette.primary.main;
  
  const handleExpandClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onRefresh) {
      onRefresh();
    }
  };

  const cardContent = (
    <Card 
      elevation={variant === 'elevation' ? elevation : 0}
      variant={variant === 'outlined' ? 'outlined' : undefined}
      onClick={onClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s, border 0.3s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
        cursor: onClick ? 'pointer' : 'default',
        minHeight: minHeight || 'auto',
        borderLeft: highlight ? `4px solid ${theme.primaryColor || muiTheme.palette.primary.main}` : undefined,
        position: 'relative',
        overflow: 'visible', // Allow badge to overflow
        ...cardStyles,
      }}
    >
      <CardHeader
        title={
          isLoading ? (
            <Skeleton variant="text" width="60%" height={28} />
          ) : (
            <Typography variant="h6" component="h2" fontWeight="500">{title}</Typography>
          )
        }
        subheader={
          subtitle && (
            isLoading ? (
              <Skeleton variant="text" width="40%" height={20} />
            ) : (
              <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
            )
          )
        }
        avatar={
          icon && (
            isLoading ? (
              <Skeleton variant="circular" width={40} height={40} />
            ) : (
              <Avatar
                sx={{
                  bgcolor: `${defaultIconColor}15`, // Using transparency
                  color: defaultIconColor,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                {icon}
              </Avatar>
            )
          )
        }
        action={
          <Box sx={{ display: 'flex' }}>
            {onRefresh && (
              <Tooltip title="Refresh data">
                <IconButton 
                  aria-label="refresh" 
                  onClick={handleRefresh}
                  sx={{ 
                    mr: 1,
                    '&:hover': {
                      animation: 'spin 1s linear',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    },
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {expandableContent && (
              <Tooltip title={expanded ? "Show less" : "Show more"}>
                <IconButton
                  onClick={handleExpandClick}
                  aria-expanded={expanded}
                  aria-label="show more"
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    mr: 1,
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Tooltip>
            )}
            {action || (
              <Tooltip title="More options">
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
      />
      
      {headerDivider && <Divider />}
      
      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={40} width="70%" />
          </Box>
        ) : content}
      </CardContent>
      
      {expandableContent && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider />
          <CardContent>
            {expandableContent}
          </CardContent>
        </Collapse>
      )}
      
      {footer && (
        <>
          {footerDivider && <Divider />}
          <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
            {isLoading ? (
              <Skeleton variant="rectangular" height={30} width="100%" />
            ) : footer}
          </CardActions>
        </>
      )}
    </Card>
  );

  return showBadge && badgeContent ? (
    <Badge
      badgeContent={badgeContent}
      color={badgeColor}
      sx={{
        '& .MuiBadge-badge': {
          right: 16,
          top: 16,
        },
      }}
    >
      {cardContent}
    </Badge>
  ) : cardContent;
};

export default DashboardCard;
