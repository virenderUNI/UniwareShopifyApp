import { createApplicationRecurrentCharge, getLocationForShop, handleApplicationCharge } from './apiClient';
import { authenticateUser } from './uniwareService.server';
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
        return {"successful":true,"data":{chargeId:tenantDetailsResponse.data.chargeId || null}};
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
        locationId: singleLocationDataShop.id.toString() || ''
    };

    try{
        const response = await createShopifyUniwareTenant(tenantParams);
        if(response.successful)
        {
            return {"successful":true,"data":{chargeId:null}}
        }
    }
    catch(error){
        return {"successful":false,"error":`Unable to save tenantCreationDetails ${error.message || 'Unknown error'}`}
    }
    return null;

}


// async function handleApplicationCharge(admin, session) {
//     try {
//         const responseJson = await createApplicationRecurrentCharge(admin, session);
//         console.log(responseJson);
//         const userErrors = responseJson.data.appSubscriptionCreate.userErrors;

//         if (userErrors.length > 0) {
//             throw new Error(userErrors.map(error => error.message).join(', '));
//         }

//         return { "successful":true,"data":{ confirmationUrl: responseJson.data.appSubscriptionCreate.confirmationUrl ,chargeId : null}};
//     } catch (error) {
//         throw new Error("Error " + JSON.stringify(error));
//     }
// }


export async function createUniwareLoginSession(tenantCode, username, password, admin, session) {
    const shopDetails = session.shop;

    try {
        const shopUniwareAuthDetails = await findUniwareCred(shopDetails);

        if (!shopUniwareAuthDetails.successful) {
            await handleUniwareAuth(username, password, tenantCode, shopDetails);
        }


        const createTenantVoResponse = await createTenantIfNotExists(shopDetails, tenantCode, session);

        if (createTenantVoResponse.successful) {
            if(createTenantVoResponse.data.chargeId !== null)
            {
                return createTenantVoResponse;
            }
            const result = await handleApplicationCharge(admin, session);
            return result;
        }
        return createTenantVoResponse;
    } catch (error) {
        return { "successful":false ,  error: error.message };
    }
}

