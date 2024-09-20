import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { findShopifyUniwareTenant, updateChargeIdShopifyUniware, updateShopifyUniwareTenant } from "../mao/uniwareSessionMao.server";
import axios from "axios";

export const loader = async ({ request }) => {
    const { session, redirect } = await authenticate.admin(request)
    const requestUrl = new URL(request.url)
    const chargeId = requestUrl.searchParams.get("charge_id");
    const redirectHome = "/app";
    const redirectChannelPagePath = "/app/channel";

    if (chargeId == null) {
        // on declining charges , shopify redirects user to installed app section.
        const errorMessage = "Unable to create charge Id as user declined to accept charges"
        return redirect(`/app?message=${errorMessage}`)

    }

    // save chargeId to shopifyProxyMongo collection 
    const response = await saveChargeIdProxy(chargeId,session.shop,session.accessToken)
    console.log("response save charge id is",response.successful);
    if (!response.successful) {
        console.log("redirecting to app")
        const errorMessage = "Unable to create charge Id as user declined to accept charges"
        throw redirect(`/app?message=${errorMessage}`)
    }
    try {
        updateChargeIdShopifyUniware(session.shop, chargeId, session.accessToken)
        const shopifyUniwareTenant = await findShopifyUniwareTenant(session.shop)
        if (!shopifyUniwareTenant.successful) {
            redirect(`/app?message=${shopifyUniwareTenant.error}`)
        }
        console.log(shopifyUniwareTenant.data.tenantSetupStatus );
        if (shopifyUniwareTenant.data.tenantSetupStatus == "INITIATED") {
            console.log("updating tenant status to running");
            const updatedTenantStatus = { tenantSetupStatus: "RUNNING" }
            const updateResponse = await updateShopifyUniwareTenant(session.shop, updatedTenantStatus, shopifyUniwareTenant.data.version);
            console.log("updateResponse for tenant to running", updateResponse);
            if (!updateResponse.successful) {

                redirect(`/app?message=${shopifyUniwareTenant.error}`)
            }
        }

    } catch (error) {
        const errorMessage = "Unexpected Error occured, unabled to save chargeId. Please try again."
        redirect(`/app?message=${errorMessage}`)
    }

    return redirect(`/app/channel`);
}

async function saveChargeIdProxy(chargeId, shopifyDetails, accessToken) {
    console.log(chargeId,accessToken)
    const shopName = shopifyDetails.split('.')[0];
    const shopifyUniwareTenant = await findShopifyUniwareTenant(shopifyDetails);
    console.log(shopName);
    console.log(shopifyUniwareTenant.data.tenantCode);

    try {
        
        const response = await axios.post('http://localhost:8181/shopify/app/create/chargeId', {
            "chargeId": chargeId,
            "shopName": shopName,
            "tenantCode": shopifyUniwareTenant.data.tenantCode,
            "shopifyAccessToken": accessToken
        }, {
            headers: {
                'Content-Type': 'application/json',
                'app-client-id': process.env.SHOPIFY_API_KEY,
                'app-client-secret': process.env.SHOPIFY_API_SECRET,
            },
        })
        console.log("response saving charge id is ",response.data)
        return response.data;
    }
    catch (error) {
        console.log(error.response.data)
        return { "successful":false, error: "Unable to save charge Id to proxy service."}
    }

}
