import { json } from "@remix-run/node";
import { createShopifyUniwareTenant, findShopifyUniwareTenant, updateShopifyUniwareTenant } from "../mao/uniwareSessionMao.server";
import { checkAccessUrlAvailability, checkUserAvailability } from "./uniwareService.server";
import { handleApplicationCharge } from "./apiClient.server";


export async function validateEmailAndPhone(email, phone, shopDetails) {
    if (!email || !phone) {
        return { successful: false, error: 'Email and phone are required.' };
    }

    try {
        const userAvailabilityResponse = await checkUserAvailability(email, phone);
        if (!userAvailabilityResponse.successful) {
            return { successful: false, error: userAvailabilityResponse.error };
        }
        const tenantShopifyDetailsResponse = await findShopifyUniwareTenant(shopDetails);
        if (tenantShopifyDetailsResponse.successful == false) {

            const newUserDetailsMap = {
                email: email,
                phone: phone,
                tenantSetupStatus: "INITIATED",
                shopDomain: shopDetails
            }
            const creationResponse = await createShopifyUniwareTenant(newUserDetailsMap);
            if (!creationResponse.successful) {
                return { successful: false, error: creationResponse.error };
            }
            return { successful: true, message: 'Email and phone validated. Tenant created successfully.' };
        }
        else {
            const userDetails = {
                "email": email,
                "phone": phone
            };
            if (tenantShopifyDetailsResponse.data.tenantSetupStatus == "RUNNING") {
                return { successful: false, message: 'Tenant Creation already in progress' };
            }
            await updateShopifyUniwareTenant(shopDetails, userDetails, tenantShopifyDetailsResponse.data.version);
            return { successful: true, message: 'Email and phone validated. Tenant created successfully.' };
        }

    } catch (error) {
        console.error('Error validating email and phone:', error);
        return {
            successful: false,
            error: `Failed to validate email/phone. ${error.message || 'Unknown error occurred'}`,
        };
    }
}

export async function validateTenantCode(shopDetails, tenantCode) {

    if (!tenantCode) {
        return { successful: false, error: 'Email and phone are required.' };
    }

    try {
        const shopifyUniwareTenantResponse = await findShopifyUniwareTenant(shopDetails);
        if (shopifyUniwareTenantResponse.successful ) {
            if( shopifyUniwareTenantResponse.data.tenantSetupStatus === "RUNNING") {
                return {successful:false, error:"setup already in progress"}
            }
            console.log("updating tenantCode")
            const shopifyUniwareTenant = shopifyUniwareTenantResponse.data;
            const checkAvailabilityResponse = await checkAccessUrlAvailability(tenantCode, shopifyUniwareTenant.phone)
            console.log("checkAvailabilityResponse is ",checkAvailabilityResponse);
            if (checkAvailabilityResponse.successful) {
                const updateTenantCode = { "tenantCode": checkAvailabilityResponse.tenantCode }
                await updateShopifyUniwareTenant(shopDetails, updateTenantCode, shopifyUniwareTenant.version);
            }
            return checkAvailabilityResponse
        }
        else {
            return { successful: false, error: shopifyUniwareTenantResponse.error }
        }
    } catch (error) {
        console.log('Error validating tenantCode', error);
        return { successful: false, error: 'Failed to validate tenant code.' };
    }
}

export async function generateTenantCode(shopDetails) {

    try {
        const shopifyUniwareTenantResponse = await findShopifyUniwareTenant(shopDetails);
        if (shopifyUniwareTenantResponse.successful) {
            const shopifyUniwareTenant = shopifyUniwareTenantResponse.data;
            const phone = shopifyUniwareTenant.phone;
            console.log("phone number is ", phone);
            const tenantCode = `${shopDetails.split('.')[0]}${phone.slice(-2)}`;
            console.log("made up tenantCode is ", tenantCode);
            return { successful: true, "data": { "tenantCode": tenantCode } }
        }
        else {
            return { successful: false, error: shopifyUniwareTenantResponse.error }
        }
    } catch (error) {
        console.log('Error validating tenantCode', error);
        return { successful: false, error: 'Failed to validate tenant code.' };
    }

}

export async function saveTenantCreationParams(session, tenantCreationDetails, admin) {

    const shopDetails = session.shop

    const tenantShopifyDetailsResponse = await findShopifyUniwareTenant(shopDetails);
    if (tenantShopifyDetailsResponse.successful == false) {

        return { successful: false, message: 'Invalid Setup' };
    }
    else {
        if (tenantShopifyDetailsResponse.data.tenantSetupStatus == "RUNNING") {
            return { successful: false, message: 'Tenant Creation already in progress' };
        }
        const updateResponse = await updateShopifyUniwareTenant(shopDetails, tenantCreationDetails, tenantShopifyDetailsResponse.data.version);
        if (!updateResponse.successful) {
            return updateResponse;
        }
        const result = handleApplicationCharge(admin, session);
        return result;
    }


}


