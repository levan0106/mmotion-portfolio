/**
 * Goal Plan Explanation Modal
 * Explains the relationship between Portfolio, Goal, and Plan with examples
 */

import React from 'react';
import {
  Box,
  Card,
  Divider,
} from '@mui/material';
import {
  AccountBalance as PortfolioIcon,
  Flag as GoalIcon,
  Assignment as PlanIcon,
  TrendingUp as TrendingUpIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { ModalWrapper, ResponsiveTypography, ResponsiveButton } from '../Common';

interface GoalPlanExplanationModalProps {
  open: boolean;
  onClose: () => void;
}

export const GoalPlanExplanationModal: React.FC<GoalPlanExplanationModalProps> = ({
  open,
  onClose,
}) => {

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Hiểu về Hệ thống: Portfolio, Goal và Plan"
      maxWidth="lg"
      fullWidth
      actions={
        <ResponsiveButton variant="contained" onClick={onClose}>
          Đóng
        </ResponsiveButton>
      }
    >
      <Box sx={{ py: 1.5 }}>
        {/* Introduction */}
        <Box sx={{ mb: 2.5 }}>
          <ResponsiveTypography variant="body1" sx={{ mb: 1.5, lineHeight: 1.6, color: 'text.secondary' }} ellipsis={false}>
            Hệ thống được xây dựng trên 3 khái niệm, mỗi khái niệm có vai trò riêng và bổ trợ lẫn nhau:
          </ResponsiveTypography>
        </Box>

        {/* Portfolio Section */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <PortfolioIcon sx={{ fontSize: 28, color: 'primary.main', mr: 1.5 }} />
            <ResponsiveTypography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              1. Portfolio
            </ResponsiveTypography>
          </Box>
          <Box sx={{ pl: { xs: 0, sm: 5 }, mb: 1.5 }}>
            <ResponsiveTypography variant="body1" sx={{ mb: 1.5, lineHeight: 1.6 }} ellipsis={false}>
              <strong>Portfolio</strong> là danh mục đầu tư thực tế của bạn, chứa các tài sản và giao dịch cụ thể. Đây là nơi bạn quản lý và theo dõi các khoản đầu tư hiện tại của mình.
            </ResponsiveTypography>
            <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 1.5 }}>
              Đặc điểm chính:
            </ResponsiveTypography>
            <Box component="ul" sx={{ pl: 3, mb: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Chứa Assets:</strong> Cổ phiếu, trái phiếu, vàng, bất động sản và các loại tài sản đầu tư khác
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Theo dõi Trades:</strong> Ghi nhận tất cả các giao dịch mua/bán, đầu tư/rút vốn
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Tính toán hiệu suất:</strong> NAV (Net Asset Value), TWR (Time-Weighted Return), IRR (Internal Rate of Return), và phân bổ tài sản
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 0, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Giá trị thực tế:</strong> Phản ánh giá trị hiện tại của các khoản đầu tư
                </ResponsiveTypography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Goal Section */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <GoalIcon sx={{ fontSize: 28, color: 'warning.main', mr: 1.5 }} />
            <ResponsiveTypography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
              2. Goal
            </ResponsiveTypography>
          </Box>
          <Box sx={{ pl: { xs: 0, sm: 5 }, mb: 1.5 }}>
            <ResponsiveTypography variant="body1" sx={{ mb: 1.5, lineHeight: 1.6 }} ellipsis={false}>
              <strong>Goal</strong> là mục tiêu tài chính cụ thể với thời hạn và giá trị mục tiêu rõ ràng. Mỗi Goal đại diện cho một mục tiêu bạn muốn đạt được trong tương lai.
            </ResponsiveTypography>
            <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 1.5 }}>
              Đặc điểm chính:
            </ResponsiveTypography>
            <Box component="ul" sx={{ pl: 3, mb: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Target Value & Target Date:</strong> Giá trị mục tiêu và thời hạn cụ thể để đạt được mục tiêu
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Current Value & Achievement %:</strong> Giá trị hiện tại và phần trăm hoàn thành mục tiêu
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Liên kết với nhiều Portfolio:</strong> Một Goal có thể theo dõi tiến độ từ nhiều Portfolio khác nhau
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 0, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Priority & Status tracking:</strong> Theo dõi mức độ ưu tiên và trạng thái (Active, Achieved, Paused, Cancelled)
                </ResponsiveTypography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Plan Section */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <PlanIcon sx={{ fontSize: 28, color: 'success.main', mr: 1.5 }} />
            <ResponsiveTypography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
              3. Plan
            </ResponsiveTypography>
          </Box>
          <Box sx={{ pl: { xs: 0, sm: 5 }, mb: 1.5 }}>
            <ResponsiveTypography variant="body1" sx={{ mb: 1.5, lineHeight: 1.6 }} ellipsis={false}>
              <strong>Plan</strong> là kế hoạch dài hạn để đạt tự do tài chính. Plan tính toán và đề xuất chiến lược đầu tư dựa trên các thông số bạn cung cấp, giúp bạn hình dung con đường đạt được mục tiêu tài chính.
            </ResponsiveTypography>
            <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 1.5 }}>
              Đặc điểm chính:
            </ResponsiveTypography>
            <Box component="ul" sx={{ pl: 3, mb: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Tính toán linh hoạt:</strong> RRR (Required Return Rate), số năm đầu tư, số tiền đầu tư định kỳ, và các thông số khác
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Đề xuất Asset Allocation:</strong> Gợi ý phân bổ tài sản tối ưu dựa trên mục tiêu và khả năng chấp nhận rủi ro
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Yearly Projections & Scenarios:</strong> Dự báo giá trị theo từng năm và các kịch bản khác nhau
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 0, display: 'flex', alignItems: 'flex-start' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Liên kết Portfolio & Goals:</strong> Kết nối với các Portfolio và Goals để tạo một kế hoạch tổng thể
                </ResponsiveTypography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Relationship Section */}
        <Box sx={{ mb: 2.5 }}>
          <ResponsiveTypography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
            Mối quan hệ giữa các khái niệm:
          </ResponsiveTypography>
          <Box sx={{ pl: { xs: 0, sm: 3 } }}>
            <ResponsiveTypography variant="body1" sx={{ mb: 1.5, lineHeight: 1.6 }} ellipsis={false}>
              Ba khái niệm này có mối quan hệ <strong>Many-to-Many</strong> (nhiều-nhiều) với nhau:
            </ResponsiveTypography>
            <Box component="ul" sx={{ pl: 3, mb: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <LinkIcon sx={{ fontSize: 18, color: 'primary.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Portfolio ↔ Goal:</strong> Một Portfolio có thể phục vụ nhiều Goals, và một Goal có thể theo dõi từ nhiều Portfolio
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <LinkIcon sx={{ fontSize: 18, color: 'warning.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Goal ↔ Plan:</strong> Một Plan có thể liên kết với nhiều Goals, và một Goal có thể thuộc nhiều Plans
                </ResponsiveTypography>
              </Box>
              <Box component="li" sx={{ mb: 0, display: 'flex', alignItems: 'flex-start' }}>
                <LinkIcon sx={{ fontSize: 18, color: 'success.main', mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  <strong>Portfolio ↔ Plan:</strong> Một Plan có thể sử dụng dữ liệu từ nhiều Portfolio, và một Portfolio có thể tham gia nhiều Plans
                </ResponsiveTypography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Example Section */}
        <Box sx={{ mb: 2.5 }}>
          <ResponsiveTypography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
            Ví dụ cụ thể:
          </ResponsiveTypography>
          <Card sx={{ p: 2, border: '1px solid', borderColor: 'info.main' }}>
            <ResponsiveTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Scenario: "Tự do tài chính trong 15 năm"
            </ResponsiveTypography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PortfolioIcon sx={{ fontSize: 22, color: 'primary.main', mr: 1 }} />
                <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Portfolio:
                </ResponsiveTypography>
              </Box>
              <Box sx={{ pl: { xs: 0, sm: 4 } }}>
                <ResponsiveTypography variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }} ellipsis={false}>
                  • <strong>Portfolio chính:</strong> 500 triệu (Cổ phiếu, Trái phiếu)
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  • <strong>Portfolio phụ:</strong> 200 triệu (Vàng, Bất động sản)
                </ResponsiveTypography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <GoalIcon sx={{ fontSize: 22, color: 'warning.main', mr: 1 }} />
                <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Goals:
                </ResponsiveTypography>
              </Box>
              <Box sx={{ pl: { xs: 0, sm: 4 } }}>
                <ResponsiveTypography variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }} ellipsis={false}>
                  • <strong>Goal 1:</strong> Tích lũy 5 tỷ trong 10 năm → Liên kết với Portfolio chính
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  • <strong>Goal 2:</strong> Mua nhà 3 tỷ trong 8 năm → Liên kết với Portfolio phụ
                </ResponsiveTypography>
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PlanIcon sx={{ fontSize: 22, color: 'success.main', mr: 1 }} />
                <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Plan:
                </ResponsiveTypography>
              </Box>
              <Box sx={{ pl: { xs: 0, sm: 4 } }}>
                <ResponsiveTypography variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }} ellipsis={false}>
                  • <strong>Tên:</strong> "Tự do tài chính 15 năm"
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }} ellipsis={false}>
                  • <strong>Liên kết:</strong> Portfolio chính + Portfolio phụ
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }} ellipsis={false}>
                  • <strong>Liên kết:</strong> Goal 1 + Goal 2
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }} ellipsis={false}>
                  • <strong>Tính toán:</strong> Cần đầu tư 10 triệu/tháng, RRR 12%
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }} ellipsis={false}>
                  • <strong>Đề xuất phân bổ:</strong> 60% Cổ phiếu, 30% Trái phiếu, 10% Vàng
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" sx={{ lineHeight: 1.6 }} ellipsis={false}>
                  • <strong>Dự báo:</strong> Giá trị sau 15 năm = 8 tỷ
                </ResponsiveTypography>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Summary Table */}
        <Box sx={{ mt: 2.5 }}>
          <ResponsiveTypography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
            Tóm tắt:
          </ResponsiveTypography>
          <Card>
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr" sx={{ bgcolor: 'primary.main', color: 'white' }}>
                    <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>
                      Khái niệm
                    </Box>
                    <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>
                      Mục đích
                    </Box>
                    <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>
                      Thời gian
                    </Box>
                    <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>
                      Tính toán
                    </Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  <Box component="tr" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PortfolioIcon sx={{ fontSize: 16, color: 'primary.main', mr: 1 }} />
                        <strong>Portfolio</strong>
                      </Box>
                    </Box>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      Quản lý tài sản thực tế
                    </Box>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      Hiện tại
                    </Box>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      NAV, TWR, IRR
                    </Box>
                  </Box>
                  <Box component="tr" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GoalIcon sx={{ fontSize: 16, color: 'warning.main', mr: 1 }} />
                        <strong>Goal</strong>
                      </Box>
                    </Box>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      Mục tiêu cụ thể
                    </Box>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      Có deadline
                    </Box>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      % hoàn thành
                    </Box>
                  </Box>
                  <Box component="tr">
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PlanIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                        <strong>Plan</strong>
                      </Box>
                    </Box>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      Kế hoạch dài hạn
                    </Box>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      Dài hạn (10-30 năm)
                    </Box>
                    <Box component="td" sx={{ p: 1.5, fontSize: '0.875rem' }}>
                      RRR, Projections
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>
    </ModalWrapper>
  );
};

