import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendEmail } from "../services/emailService.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin } = await authenticate.webhook(request);

  if (!admin && topic !== "SHOP_REDACT") {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    // The SHOP_REDACT webhook will be fired up to 48 hours after a shop uninstalls the app.
    // Because of this, no admin context is available.
    throw new Response();
  }

  // The topics handled here should be declared in the shopify.app.toml.
  // More info: https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration
  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
        await sendEmail("deactivateChannel",shop);
      }
      break;
    case "APP_UNINSTALLED":
    case "SHOP_REDACT":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
        await sendEmail("deactivateTenant",shop);
      }
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
