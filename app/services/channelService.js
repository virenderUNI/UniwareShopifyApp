import { findShopifyUniwareChannelDetails, findShopifyUniwareTenant } from "../mao/uniwareSessionMao.server";
import { getLocationForShop } from "./apiClient";
import { addChannelConnectorUniware, createNewUniwareTenantShopifyChannel, createShopifyChannelUniware, getShopifyChannelDetailsUniware } from "./uniwareService.server";

async function fetchChannelDetailsFromShopifyUniwareService() {

    try {
        const response = await axios.post('https://external.api/get-existing-channel-details', {
            tenantCode,
        }, {
            headers: {
            'Content-Type': 'application/json',
            'uni-source-code': 'SHOPIFY',
            'uni-channel-code': 'SHOPIFY',
            'hostname': shopDetails,
            'apiKey': process.env.SHOPIFY_API_SECRET,
            'password': accessToken,
            },
        });
        return response;
    }
    catch(error) {
        if(error.response && error.response.headers['content-type'] != 'application/json'){
            return {
                data: {errorMessage:"It's on us. We are unable to verify your credentials.Please try after sometime."},
                status: 502
            };
        }
        throw error;
    }
}


export async function buildShopifyChannelUniware(shopDetails,accessToken) {
    console.log("create shopify channel or update connectors on uniware");
    console.log("shopDetails and accessToken are ",shopDetails,accessToken)
    const shopifyUniwareChannel = await findShopifyUniwareChannelDetails(shopDetails)
    if (shopifyUniwareChannel.data == null) {
        const shopifyUniwareTenant = await findShopifyUniwareTenant(shopDetails);
        console.log("shopifyUniwareTenant details before checking tenant or channel creation ", shopifyUniwareTenant);
        if (shopifyUniwareTenant.data.tenantSetupStatus === "COMPLETE") {

            console.log("reaching here to connect connectors")

            // const proxyShopifyChannelDetailsResponse = await findProxyShopifyChannelDetails(); // from proxy Service
            if (!proxyShopifyChannelDetailsResponse.errors && proxyShopifyChannelDetails == null) {
                const connectorParams = await createConnectorMap(shopDetails,accessToken);
                const createShopifyChannelUniwareResponse = await createShopifyChannelUniware(connectorParams);
                return createShopifyChannelUniwareResponse;
            }
            else if (!proxyShopifyChannelDetailsResponse.errors) {
                const paramsMap = new Map();
                paramsMap.put("hostname", shopDetails)
                paramsMap.put("channelCode", proxyShopifyChannelDetailsResponse.channelCode)
                
                const uniwareShopifyChannelDetails = await getShopifyChannelDetailsUniware(params)
                if(uniwareShopifyChannelDetails.successful) {

                    const connectorParams = await createConnectorMap(shopDetails,accessToken);
                    const updatedChannelConnectors = await addChannelConnectorUniware(connectorParams);
                }
            }
            else {
                return proxyShopifyChannelDetailsResponse;
            }
        }
        else if (shopifyUniwareTenant.data.tenantSetupStatus === "RUNNING") {
            console.log("creating new tenant");
            const tenantCreationResponse = createNewUniwareTenantShopifyChannel(shopDetails,accessToken)
        }
    }

}

async function createConnectorMap(shopDetails,accessToken) {
    const connectorParams = new Map();
    const locationResponse = await getLocationForShop(shopDetails,accessToken);
    const locationId = locationResponse.data.locations[0].id

    connectorParams.set("hostname", shopDetails)
    connectorParams.set("apiKey", process.env.SHOPIFY_API_KEY)
    connectorParams.set("password", accessToken)
    connectorParams.set("locationId", locationId)
    connectorParams.set("Email", "TRUE")
    connectorParams.set("prefix", "prefix")
    connectorParams.set("trackingUrl", "TRUE")

    return connectorParams;
}