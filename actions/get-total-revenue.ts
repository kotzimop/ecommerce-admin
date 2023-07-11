import prismadb from "@/lib/prismadb";

export const getTotalRevenue = async (storeId: string) => {
  // Get all orders that isPaid is completed
  const paidOrders = await prismadb.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  //   Calculate the total from all orders
  const totalRevenue = paidOrders.reduce((total, order) => {
    // Cakculate the total amount of each order - iterate all order items
    const orderTotal = order.orderItems.reduce((orderSum, item) => {
      return orderSum + item.product.price.toNumber();
    }, 0);
    return total + orderTotal;
  }, 0);

  return totalRevenue;
};
