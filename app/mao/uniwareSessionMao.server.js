import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function createUniwareTenantAuth(params) {

    const expiresAt = new Date().getTime() + Number(params.get("expiresIn")) * 1000;
    console.log("expiresAt is ", expiresAt);
    const paramsObj = Object.fromEntries(params);

    try {
        await prisma.appUniwareAuth.create({
            data: {
                ...paramsObj,
                "expiresAt": expiresAt
            }
        })
        return { "successful": true, "data": paramsObj, "errors": null }
    } catch (error) {
        throw error
    }
}

export async function updateUniwareTenantAuth(params) {
    const expiresAt = new Date().getTime() + Number(params.expiresIn) * 1000;

    try {
        await prisma.appUniwareAuth.update({
            where: { shopDomain: params.shopDomain },
            data: {
                authToken: params.authToken,
                refreshToken: params.refreshToken,
                expiresAt,
                tokenType: params.tokenType
            }
        });
        return { successful: true, message: 'Auth updated successfully' };
    } catch (error) {
        console.error('Error updating Uniware tenant auth:', error);
        return { successful: false, error: 'Unable to update Uniware tenant auth' };
    }
}

export async function findUniwareCred(shop) {
    console.log("Finding appUniwareCred for shop:", shop);

    try {
        const appUniwareCred = await prisma.appUniwareAuth.findFirst({
            where: { shopDomain: shop },
        });
        console.log("appUniwareCred is", appUniwareCred);
        return appUniwareCred ? { successful: true, data: appUniwareCred } : { successful: false, data: null, error: 'No credentials found' };
    } catch (error) {
        console.error('Error finding Uniware credentials:', error);
        return { successful: false, data: null, error: 'Unable to fetch Uniware credentials' };
    }
}

export async function findShopifyUniwareTenant(shop) {
    try {
        const shopifyUniwareTenant = await prisma.shopUniwareTenant.findUnique({
            where: { shopDomain: shop },
        });
        console.log("shopifyUniwareTenant Details are", shopifyUniwareTenant);
        return shopifyUniwareTenant ? { successful: true, data: shopifyUniwareTenant } : { successful: false, data: null, error: 'Tenant not found' };
    } catch (error) {
        console.error('Error finding Shopify Uniware tenant:', error);
        throw error;
    }
}

export async function updateShopifyUniwareTenant(shopDomain, updateData, currentVersion) {
    try {
        const updatedTenant = await prisma.shopUniwareTenant.update({
            where: {
                shopDomain
            },
            data: {
                ...updateData,
                version: { increment: 1 }  
            },
            select: { version: true }  
        });

        if (updatedTenant.version !== currentVersion + 1) {
            throw new Error('Version mismatch - the document was updated by another process.');
        }

        return { successful: true, message: 'Tenant updated successfully.' };

    } catch (error) {
        console.error('Error updating Shopify Uniware tenant:', error);
        throw error
    }
}

export async function createShopifyUniwareTenant(params) {

    try {
        await prisma.shopUniwareTenant.create({
            data: { ...params }
        });
        return { successful: true, message: 'Shopify Uniware tenant created successfully' };
    } catch (error) {
        throw error
    }
}

export async function updateChargeIdShopifyUniware(shop, chargeId) {
    console.log("Saving charge Id to database");

    try {
        await prisma.shopUniwareTenant.update({
            where: { shopDomain: shop },
            data: { chargeId }
        });
        return { successful: true, message: 'Charge ID updated successfully' };
    } catch (error) {
        console.error('Error updating charge ID for Shopify Uniware:', error);
        throw error
    }
}

export async function saveShopifyUniwareChannelDetails(params) {
    const paramsObj = Object.fromEntries(params);

    try {
        await prisma.shopifyUniwareChannel.create({
            data: { ...paramsObj }
        });
        return { successful: true, message: 'Shopify Uniware channel details saved successfully' };
    } catch (error) {
        console.error('Error saving Shopify Uniware channel details:', error);
        return { successful: false, error: 'Unable to save Shopify Uniware channel details' };
    }
}

export async function findShopifyUniwareChannelDetails(shopDetails) {
    try {
        const shopifyUniwareChannelDetails = await prisma.shopifyUniwareChannel.findUnique({
            where: { hostname: shopDetails }
        });
        return { successful: true, data: shopifyUniwareChannelDetails };
    } catch (error) {
        console.error('Error finding Shopify Uniware channel details:', error);
        return { successful: false, data: null, error: 'Unable to fetch Shopify Uniware channel details' };
    }
}

