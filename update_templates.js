const supabase = require('./backend/db.js');
const run = async () => {
  const { data, error } = await supabase.from('admin_settings').update({
    preparing_email_template: `👨‍🍳 *Order Update – AparnaCanteen*

Hello [Name]! 😊

Your *Order #[OrderNumber]* is now being *prepared in the kitchen*. 👨‍🍳

💰 *Total Amount:* ₹[TotalAmount]

Your order will be ready shortly. Thank you for your patience! 🙏

— *AparnaCanteen*`,
    completed_email_template: `✅ *Order Completed – AparnaCanteen*

Hello [Name]! 😊

Your *Order #[OrderNumber]* has been *successfully completed*. 🎉

Thank you for ordering from *AparnaCanteen*! ❤️
We hope you enjoyed your meal and look forward to serving you again! 🙏

— *AparnaCanteen*`
  }).eq('id', 1);
  if (error) console.error(error);
  else console.log('Successfully updated Supabase templates!');
};
run();
