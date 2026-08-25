// GET /api/app/v1/order/get-payment-methods  (对齐原站支付方式)
// demo 模式：返回受支持的支付方式列表（无真实支付网关密钥）。
export default defineEventHandler(() => {
  return {
    paymentMethods: [
      { id: 'card', name: 'Credit / Debit Card', enabled: true },
      { id: 'paypal', name: 'PayPal', enabled: true },
      { id: 'applepay', name: 'Apple Pay', enabled: false },
      { id: 'googlepay', name: 'Google Pay', enabled: false }
    ]
  }
})
