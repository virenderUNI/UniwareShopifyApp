import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { findShopifyUniwareTenant,updateChargeIdShopifyUniware, updateShopifyUniwareTenant } from "../mao/uniwareSessionMao.server";

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
    // const response = await saveChargeIdProxy(chargeId,session.shop)
    // if (response.error) {
    //     redirect(`/app?message=${response.error}`)
    // }
    try {
        updateChargeIdShopifyUniware(session.shop,chargeId,session.accessToken)
        const shopifyUniwareTenant = await findShopifyUniwareTenant(session.shop)
        if(!shopifyUniwareTenant.successful) {
            redirect(`/app?message=${shopifyUniwareTenant.error}`)
        }
        console.log("updating tenant status to running");
        const updatedTenantStatus = {tenantSetupStatus:"RUNNING"}
        const updateResponse = await updateShopifyUniwareTenant(session.shop,updatedTenantStatus,shopifyUniwareTenant.data.version);
        console.log("updateResponse for tenant to running",updateResponse);
        if(!updateResponse.successful)
        {

            redirect(`/app?message=${shopifyUniwareTenant.error}`)
        }

    } catch (error) {
        const errorMessage = "Unexpected Error occured, unabled to save chargeId. Please try again."
        redirect(`/app?message=${errorMessage}`)
    }

    return redirect(`/app/channel`);
}

async function saveChargeIdProxy(chargeId,shopifyDetails,accessToken) {
    const shopifyProxyUrl = "/shopify/app/create/chargeId";
    const requestHeaders = {
        "app-client-id": process.env.SHOPIFY_API_KEY,
        "app-client-secret": "c844162e186bbe5bc93bbf68d5e63cd1"
    }
    const shopifyUniwareTenant = await findShopifyUniwareTenant(shopifyDetails)
    const shopChargeIdRequest = {
        "chargeId": chargeId,
        "shopName": shopifyUniwareTenant.data.shopDomain,
        "tenantCode": shopifyUniwareTenant.data.tenantCode,
        "shopifyAccessToken": accessToken
    }

    try {
        const response = await axios.post(shopifyProxyUrl, shopChargeIdRequest, requestHeaders);
        if(!response.data.successful)
        {
            return json({"error":response.data.errors.map(e =>e.message).join(','),"statusCode":response.status})
        }
    }
    catch (error) {
        return json({ error: "Unable to save charge Id to proxy service.", status: 500 })
    }
    return response.data;

}
