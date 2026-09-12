export interface MonthlyReport {
  month: number; // 0-11
  year: number;
  clientsAttended: number;
  servicesRevenueCents: number;
  productsRevenueCents: number;
  productsSold: number;
  balanceCents: number; // total = serviços + produtos
}
