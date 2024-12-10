import { json, redirect } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { Button, TextField, Card, Layout, Toast } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { useActionData, useLoaderData } from '@remix-run/react';
import { saveTenantCreationParams } from '../services/signUpService.server';
import { setSharedState } from "../services/signUpService.server";
import { getLocationForShop } from '../services/apiClient.server';
import { log } from 'console';
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";
import createApp from '@shopify/app-bridge';
import {setConfirmationUrl} from "../services/signUpService.server";



export const loader = async ({ request }) => {
    setSharedState({ shouldRunSignUpIILoader: '2' });
    const { session, admin,redirect } = await authenticate.admin(request);
    const locationResponse = await getLocationForShop(session.shop, session.accessToken);
    const singleLocationDataShop = locationResponse.data.locations[0];

    const tenantCreationParams = {
        address1: singleLocationDataShop.address1 || '',
        address2: singleLocationDataShop.address2 || '',
        city: singleLocationDataShop.city || '',
        pincode: singleLocationDataShop.zip || '',
        state: singleLocationDataShop.province || '',
        country: singleLocationDataShop.country || '',
        locationId: singleLocationDataShop.id || ''
    };
    console.log("tenantCreationParams are ",tenantCreationParams);
    // redirect("https://uniwaredevstore.myshopify.com/admin/charges/192176947201/27817803928/RecurringApplicationCharge/confirm_recurring_application_charge?signature=BAh7BzoHaWRsKwiYABJ6BgA6EmF1dG9fYWN0aXZhdGVU--bfe18e9f0fbcd1c00e157a1432831f029b522aa1",{target:"_parent"})
    return tenantCreationParams;
};

export const action = async ({ request }) => {
    const { session, admin, redirect } = await authenticate.admin(request);
    const formData = new URLSearchParams(await request.text());

    const tenantCreationParams = {
        address1: formData.get('address1'),
        address2: formData.get('address2'),
        city: formData.get('city'),
        pincode: formData.get('pincode'),
        state: formData.get('province'),
        country: formData.get('country'),
        locationId: formData.get('locationId'),
        tenantSetupStatus: "CHARGE_PENDING",
        shopDomain: session.shop

    };
    console.log("tenantCreationParams", tenantCreationParams);

    try {
        
        const response = await saveTenantCreationParams(session, tenantCreationParams,admin);
        if(response.successful) {
            setConfirmationUrl({url:response.data.confirmationUrl});
            // redirect(response.data.confirmationUrl, { target: "_parent" });
             return redirect('/app/uniwareConfirmation');
            // return {successful:true,"confirmationUrl": response.data.confirmationUrl}
          }
        // throw redirect(applicationChargeResponse.appSubscriptionCreate.confirmationUrl)
    } catch (error) {
        return json({ error: 'Failed to initate tenantCreation' });
    }

};

export default function uniwareSignUpIII() {
    const loaderData = useLoaderData();
    const [formData, setFormData] = useState(loaderData);
    const [address1, setAddress1] = useState();
    const [address2, setAddress2] = useState();
    const [city, setCity] = useState();
    const [pincode, setPincode] = useState();
    const [province, setProvince] = useState();
    const [country, setCountry] = useState();
    const actionData = useActionData();
    console.log("Action Data:", actionData); 
    const shopify = useAppBridge();

    useEffect(() => {
        console.log("USE EFFECT TRIGGERED  ........");
        if (actionData?.successful && actionData.confirmationUrl) {
            console.log("Redirecting to confirmation URL:", actionData.confirmationUrl);
            const redirect = Redirect.create(shopify);
            redirect.dispatch(Redirect.Action.REMOTE, actionData.confirmationUrl);
        }
    }, [actionData]);

    return (
        <Layout>
            <Layout.Section>
                <Card title="Enter Tenant Code" sectioned>
                    <form method="post">
                        <TextField
                            label="Address 1"
                            value={formData.address1}
                            onChange={(value) => setAddress1(value)}
                            type="text"
                            name="address1"
                        />
                        <TextField
                            label="Address 2"
                            value={formData.address2}
                            onChange={(value) => setAddress2(value)}
                            type="text"
                            name="address2"
                        />
                        <TextField
                            label="City"
                            value={formData.city}
                            onChange={(value) => setCity(value)}
                            type="text"
                            name="city"
                        />
                        <TextField
                            label="Pincode"
                            value={formData.pincode}
                            onChange={(value) => setPincode(value)}
                            type="text"
                            name="pincode"
                        />
                        <TextField
                            label="State"
                            value={formData.state}
                            onChange={(value) => setProvince(value)}
                            type="text"
                            name="province"
                        />
                        <TextField
                            label="Country"
                            value={formData.country}
                            onChange={(value) => setCountry(value)}
                            type="text"
                            name="country"
                        />
                        <input type="hidden" name="locationId" value={formData.locationId} />
                        <Button submit>Submit</Button>
                    </form>
                    {actionData?.confirmationUrl && <p>{actionData.confirmationUrl}</p>}
                </Card>
            </Layout.Section>
        </Layout>
    );
}