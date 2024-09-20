import axios from "axios";
import { findShopifyUniwareChannelDetails, findShopifyUniwareTenant, saveShopifyUniwareChannelDetails, updateShopifyUniwareTenant } from "../mao/uniwareSessionMao.server";
import { getLocationForShop } from "./apiClient.server";
import { addChannelConnectorUniware, createNewUniwareTenantShopifyChannel, createShopifyChannelUniware, getShopifyChannelDetailsUniware } from "./uniwareService.server";

async function fetchChannelDetailsFromShopifyUniwareService(tenantCode,shopDetails) {
    console.log("fetching details from proxy")
    console.log(tenantCode,shopDetails)
    const shopName = shopDetails.split('.')[0];
    console.log("shopName is ",shopName)
    try {
        const response = await axios.post('http://localhost:8181/shopify/app/channel/getChannelDetails', {
            "tenantCode": tenantCode,
            "shopName":shopName
        }, {
            headers: {
                'Content-Type': 'application/json',
                'app-client-id': process.env.SHOPIFY_API_KEY,
                'app-client-secret': process.env.SHOPIFY_API_SECRET,
            },
        });
        console.log("response is",response);
        return response.data;
    }
    catch (error) {
        console.log(error);
            return {
                data: { errorMessage: "It's on us. We are unable to verify your credentials.Please try after sometime." },
                status: 502
            };
        }
    }



export async function buildShopifyChannelUniware(shopDetails, accessToken) {
    console.log("create shopify channel or update connectors on uniware");
    console.log("shopDetails and accessToken are ", shopDetails, accessToken)
    const shopifyUniwareChannel = await findShopifyUniwareChannelDetails(shopDetails)

    if (shopifyUniwareChannel.data == null) {
        const shopifyUniwareTenant = await findShopifyUniwareTenant(shopDetails);
        console.log("shopifyUniwareTenant details before checking tenant or channel creation ", shopifyUniwareTenant);
        if (shopifyUniwareTenant.data.tenantSetupStatus === "COMPLETE") {

            console.log("reaching here to connect connectors")

            const proxyShopifyChannelDetailsResponse = await fetchChannelDetailsFromShopifyUniwareService(shopifyUniwareTenant.data.tenantCode,shopDetails); // from proxy Service

            if (!proxyShopifyChannelDetailsResponse.successful) {
                return proxyShopifyChannelDetailsResponse;
            }

            if (!proxyShopifyChannelDetailsResponse.hasChannel) {
                return ;
                const connectorParams = await createConnectorMap(shopDetails, accessToken);
                const createShopifyChannelUniwareResponse = await createShopifyChannelUniware(connectorParams);
                console.log(createShopifyChannelUniwareResponse);
                if (!createShopifyChannelUniwareResponse.successful) {
                    return createShopifyChannelUniwareResponse;
                }
                const shopifyUniwareChannelMao = await saveShopifyUniwareChannelDetails(connectorParams);
                return createShopifyChannelUniwareResponse;
            }
            else if (proxyShopifyChannelDetailsResponse.hasChannel) {
                const paramsMap = new Map();
                const channelCode = proxyShopifyChannelDetailsResponse.channelEntity.channelCode;
                paramsMap.put("hostname", shopDetails)
                paramsMap.put("channelCode", proxyShopifyChannelDetailsResponse.channelEntity.channelCode)

                if (uniwareShopifyChannelDetails.successful) {
                    const connectorParams = await createConnectorMap(shopDetails, accessToken);
                    const updatedChannelConnectors = await addChannelConnectorUniware(connectorParams,channelCode);
                    const shopifyUniwareChannelMao = await saveShopifyUniwareChannelDetails(connectorParams);
                    return updatedChannelConnectors;
                }
            }

        }
        else if (shopifyUniwareTenant.data.tenantSetupStatus === "RUNNING") {
            console.log("creating new tenant");
            // const tenantCreationResponse = createNewUniwareTenantShopifyChannel(shopDetails, accessToken)
            const connectorParams = await createConnectorMap(shopDetails, accessToken);
            const shopifyUniwareChannelMao = await saveShopifyUniwareChannelDetails(connectorParams);
            const userDetails = {
                tenantSetupStatus : "COMPLETE"
            }
            const updateShopifyUniwareTenantResponse = await updateShopifyUniwareTenant(shopDetails, userDetails, shopifyUniwareTenant.data.version);
            return tenantCreationResponse;
        }
    }
}

async function createConnectorMap(shopDetails, accessToken) {
    const connectorParams = new Map();
    const locationResponse = await getLocationForShop(shopDetails, accessToken);
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