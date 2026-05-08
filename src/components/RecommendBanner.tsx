import { useState } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  Link,
  Collapse,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Campaign as RecommendIcon,
  QrCode2 as QrCodeIcon,
} from '@mui/icons-material';

const INVITE_URL = 'https://cloud.siliconflow.cn/i/vDdG58RW';
const QR_CODE_URL = '/siliconflow-qr.png';

export default function RecommendBanner() {
  const [expanded, setExpanded] = useState(true);

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        mb: 1,
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
            : 'linear-gradient(135deg, #422006 0%, #451a03 100%)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2.5,
          py: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <RecommendIcon sx={{ color: '#f59e0b', mr: 1.2, fontSize: 22 }} />
        <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            硅基流动推荐注册 — 邀请双方均可获得免费 API 代金券
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            🔥 硅基流动推荐 — 注册送代金券
          </Box>
        </Typography>
        <Chip
          label="活动截止 2026.12.31"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ mr: 1, fontSize: '0.7rem', height: 22 }}
        />
        <IconButton size="small" sx={{ color: 'inherit' }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Typography
            variant="body2"
            sx={{ mb: 1.5, opacity: 0.85, lineHeight: 1.6 }}
          >
            通过下方邀请链接注册硅基流动（SiliconFlow），完成实名认证后，
            <strong> 被邀请者和邀请者均可获得免费 API 使用代金券</strong>
            。硅基流动提供 OpenAI、DeepSeek、Qwen、Llama 等主流大模型的高性价比
            API 服务，免科学上网即可使用。
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            {/* 邀请链接 */}
            <Link
              href={INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontWeight: 600,
                color: '#b45309',
                fontSize: '0.9rem',
                bgcolor: 'rgba(255,255,255,0.5)',
                px: 2,
                py: 0.75,
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.8)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              🌐 点击前往注册
            </Link>

            {/* 分隔线 */}
            <Box
              sx={{
                width: 1,
                height: 0,
                borderTop: '1px dashed',
                borderColor: 'divider',
                opacity: 0.4,
              }}
            />

            {/* 二维码 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <QrCodeIcon sx={{ color: '#92400e', fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                扫码注册：
              </Typography>
              <Box
                component="img"
                src={QR_CODE_URL}
                alt="扫码注册硅基流动"
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  objectFit: 'contain',
                  bgcolor: '#fff',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
