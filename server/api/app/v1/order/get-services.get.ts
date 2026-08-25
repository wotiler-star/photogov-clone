// GET /api/app/v1/order/get-services  (对齐原站订单服务列表)
// 返回可用服务：数字下载 / 打印页 / 专家核验。demo 模式，价格为示意。
export default defineEventHandler(() => {
  return {
    services: [
      {
        id: 'digital',
        name: 'Digital photo',
        description: 'High-resolution JPG + PDF for online applications.',
        price: 0,
        currency: 'USD',
        type: 'digital'
      },
      {
        id: 'print',
        name: 'Printable sheet',
        description: '4×6" print sheet with multiple compliant copies.',
        price: 0,
        currency: 'USD',
        type: 'print'
      },
      {
        id: 'expert',
        name: 'Human photo verification',
        description: 'Compliance expert reviews your photo. 99.2% approval rate.',
        price: 9.99,
        currency: 'USD',
        type: 'verification'
      }
    ]
  }
})
