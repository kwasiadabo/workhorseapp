import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const getBankingReport = (params) =>
  api.get('/banking-report', { params }).then((res) => res.data.data);

export const useBankingReport = (params) =>
  useQuery({
    queryKey: ['banking-report', params],
    queryFn: () => getBankingReport(params),
    placeholderData: (prev) => prev,
  });
