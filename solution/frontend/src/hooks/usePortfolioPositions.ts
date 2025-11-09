import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Position {
  asset_id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  average_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pl: number;
  unrealized_pl_percent: number;
  weight: number;
}

interface PositionsResponse {
  portfolio_id: string;
  positions: Position[];
  summary: {
    total_positions: number;
    total_market_value: number;
    total_unrealized_pl: number;
    total_unrealized_pl_percent: number;
  };
  retrieved_at: string;
}

export const usePortfolioPositions = (portfolioId: string | null) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [summary, setSummary] = useState<PositionsResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!portfolioId) return;

    const fetchPositions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiService.getPortfolioPositions(portfolioId);
        
        // Handle different response structures
        let positions: Position[] = [];
        let summary: PositionsResponse['summary'] | null = null;
        
        if (Array.isArray(response)) {
          // If response is directly an array of positions
          positions = response;
        } else if (response && response.positions) {
          // If response has positions property
          positions = response.positions || [];
          summary = response.summary || null;
        } else {
          console.warn('Unexpected response structure:', response);
        }
        
        setPositions(positions);
        setSummary(summary);
      } catch (err) {
        console.error('Error fetching portfolio positions:', err);
        setError('Failed to load portfolio positions');
        setPositions([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, [portfolioId]);

  return {
    positions,
    summary,
    loading,
    error,
  };
};
