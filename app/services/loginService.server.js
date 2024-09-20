import { createApplicationRecurrentCharge, getLocationForShop, handleApplicationCharge } from './apiClient.server';
import { authenticateUser, getUniwareTenantType } from './uniwareService.server';
import {
    createShopifyUniwareTenant,
    createUniwareTenantAuth,
    findShopifyUniwareTenant,
    findUniwareCred
} from '../mao/uniwareSessionMao.server';
import { json } from '@remix-run/node';


async function handleUniwareAuth(username, password, tenantCode, shopDetails) {
    const authResponse = await authenticateUser(username, password, tenantCode);

    if (authResponse.status !== 200) {
        throw new Error(authResponse.data || 'An unknown error occurred.');
    }

    const params = new Map();
    params.set('accessToken', authResponse.data.access_token);
    params.set('refreshToken', authResponse.data.refresh_token);
    params.set('expiresIn', authResponse.data.expires_in);
    params.set('tokenType', authResponse.data.token_type);
    params.set('shopDomain', shopDetails);
    params.set('tenantCode', tenantCode);

    await createUniwareTenantAuth(params);
}


async function createTenantIfNotExists(shopDetails, tenantCode, session) {
    const tenantDetailsResponse = await findShopifyUniwareTenant(shopDetails);

    if (tenantDetailsResponse.successful) {
        return { "successful": true, "data": { chargeId: tenantDetailsResponse.data.chargeId || null } };
    }

    const checkUniwareTenantTypeResponse = await getUniwareTenantType(tenantCode, shopDetails);

    console.log("checkUniwareTenantTypeResponse is ", checkUniwareTenantTypeResponse)

    if (!checkUniwareTenantTypeResponse) {
        return checkUniwareTenantTypeResponse;
    }

    const locationResponse = await getLocationForShop(shopDetails, session.accessToken);
    const singleLocationDataShop = locationResponse.data.locations[0];

    const tenantParams = {
        tenantCode: tenantCode,
        shopDomain: shopDetails,
        tenantSetupStatus: "COMPLETE",
        phone: singleLocationDataShop.phone || '',
        address1: singleLocationDataShop.address1 || '',
        address2: singleLocationDataShop.address2 || '',
        city: singleLocationDataShop.city || '',
        pincode: singleLocationDataShop.zip || '',
        state: singleLocationDataShop.province || '',
        country: singleLocationDataShop.country || '',
        locationId: singleLocationDataShop.id.toString() || '',
        tenantType: checkUniwareTenantTypeResponse.data.tenantType
    };

    try {
        const response = await createShopifyUniwareTenant(tenantParams);
        if (response.successful) {
            return { "successful": true, "data": { chargeId: null, tenantType: checkUniwareTenantTypeResponse.data.tenantType } }
        }
    }
    catch (error) {
        return { "successful": false, "error": `Unable to save tenantCreationDetails ${error.message || 'Unknown error'}` }
    }
    return null;

}


export async function createUniwareLoginSession(tenantCode, username, password, admin, session) {
    const shopDetails = session.shop;

    try {
        const shopUniwareAuthDetails = await findUniwareCred(shopDetails);

        if (!shopUniwareAuthDetails.successful) {
            await handleUniwareAuth(username, password, tenantCode, shopDetails);
        }

        const createTenantVoResponse = await createTenantIfNotExists(shopDetails, tenantCode, session);

        if (createTenantVoResponse.successful) {
            if (createTenantVoResponse.data.chargeId !== null) {
                return createTenantVoResponse;
            }
            console.log(createTenantVoResponse.data);
            if (createTenantVoResponse.data.tenantType != 'ENTERPRISE') {
                return { "successful": false, error: "This is an Enterprise Tenant.Please continue using shopify custom app for your store only." }
            }
            const result = await handleApplicationCharge(admin, session);
            return result;
        }
        return createTenantVoResponse;
    } catch (error) {
        return { "successful": false, error: error.message };
    }
}

