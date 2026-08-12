import { expensesApi, incomesApi } from "@/lib/api"

export interface FinanceSummary {
  totalIncome:  number
  totalExpense: number
  netProfit:    number
  orderIncome:  number
  manualIncome: number
}

export const financeService = {
  async getSummary(start_date?: string, end_date?: string): Promise<FinanceSummary> {
    const [incomeSummary, expenses] = await Promise.all([
      incomesApi.summary({ start_date, end_date }),
      expensesApi.list({ start_date, end_date }),
    ])

    const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

    return {
      totalIncome:  incomeSummary.total,
      totalExpense,
      netProfit:    incomeSummary.total - totalExpense,
      orderIncome:  incomeSummary.order_income,
      manualIncome: incomeSummary.manual_income,
    }
  },
  formatCurrency(amount: number, currency = "$"): string {
    return `${currency}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  },
}