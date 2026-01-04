
export const emailTemplates = {
    orderConfirmation: (order: any) => ({
        subject: `Order Confirmation - ${order.orderNumber}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8fafc; padding: 40px 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 20px 0 0;">MedDelivery</h1>
            <p style="color: #6b7280; margin: 0;">Order Confirmed</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin: 0 0 20px;">Order #${order.orderNumber}</h2>
            <p style="color: #6b7280; margin: 0;">Thank you for your order!</p>
            
            <div style="margin: 30px 0;">
              <h3 style="color: #374151; margin: 0 0 10px;">Order Details</h3>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px;">
                <p style="margin: 0 0 5px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p style="margin: 0 0 5px;"><strong>Status:</strong> <span style="color: #10b981;">${order.status}</span></p>
                <p style="margin: 0 0 5px;"><strong>Payment:</strong> <span style="color: #10b981;">${order.paymentStatus}</span></p>
                <p style="margin: 0 0 5px;"><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
                <p style="margin: 0 0 5px;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              </div>
            </div>
            
            <div style="margin: 30px 0;">
              <h3 style="color: #374151; margin: 0 0 10px;">Order Items</h3>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px;">
                ${order.items?.map((item: any) => `
                  <div style="display: flex; justify-content: space-between; margin: 0 0 10px; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                    <div>
                      <p style="margin: 0; font-weight: 600;">${item.name}</p>
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Qty: ${item.quantity}</p>
                    </div>
                    <div>
                      <p style="margin: 0; color: #374151; font-weight: 600;">$${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" style="display: inline-block; background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">
            Track Your Order
          </a>
        </div>
      </div>
    `,
    }),

    orderDelivered: (order: any) => ({
        subject: `Order Delivered - ${order.orderNumber}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f0fdf4; padding: 40px 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 20px 0 0;">MedDelivery</h1>
            <p style="color: #065f46; margin: 0;">Order Delivered</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin: 0;">Your order has been delivered!</h2>
            <p style="color: #6b7280; margin: 0;">Thank you for choosing MedDelivery.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" style="display: inline-block; background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Your Orders
            </a>
          </div>
        </div>
      </div>
    `,
    }),

    orderCancelled: (order: any) => ({
        subject: `Order Cancelled - ${order.orderNumber}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fef2f2; padding: 40px 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ef4444; margin: 20px 0 0;">Order Cancelled</h1>
            <p style="color: #6b7280; margin: 0;">We're sorry your order was cancelled</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <p style="color: #6b7280; margin: 0;">Order #${order.orderNumber}</p>
            <p style="color: #6b7280; margin: 0;">Reason: ${order.cancellationReason || 'No reason provided'}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" style="display: inline-block; background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    `,
    }),
};
