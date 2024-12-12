import { json} from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getConfirmationUrl } from "../services/signUpService.server";

export const loader = async ({ request }) => {
    const {session, admin, redirect} = await authenticate.admin(request);
    const chargeAcceptance = getConfirmationUrl(); 
    console.log("Shared state confirmation URL is: ",chargeAcceptance.confirmationUrl) ;
    return redirect(chargeAcceptance.confirmationUrl, { target: "_parent" })
    // return json({ shopDetails: JSON.stringify(shopPlanDetails.data) });
};
