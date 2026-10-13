export function verifiedPurchase(order, product) {
 return Boolean(order && order.orderStatus === 'delivered' && order.orderItems?.some(item => String(item.product) === String(product)));
}
