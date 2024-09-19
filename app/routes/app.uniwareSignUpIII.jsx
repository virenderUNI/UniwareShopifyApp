import { json, redirect } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { Button, TextField, Card, Layout, Toast } from '@shopify/polaris';
import { useState } from 'react';
import { useNavigate, useActionData, useLoaderData } from '@remix-run/react';
import { createApplicationRecurrentCharge, getLocationForShop } from '../services/apiClient';
import { saveTenantCreationParams } from '../services/signUpService';

export const loader = async ({ request }) => {

    const { session, admin } = await authenticate.admin(request);
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
            return {successful:true,"confirmationUrl": response.data.confirmationUrl}
          }
        throw redirect(applicationChargeResponse.appSubscriptionCreate.confirmationUrl)
    } catch (error) {
        return json({ error: 'Failed to initate tenantCreation' });
    }

};

export default function Step3() {
    const loaderData = useLoaderData();
    const [formData, setFormData] = useState(loaderData);
    const [address1, setAddress1] = useState();
    const [address2, setAddress2] = useState();
    const [city, setCity] = useState();
    const [pincode, setPincode] = useState();
    const [province, setProvince] = useState();
    const [country, setCountry] = useState();
    const actionData = useActionData();

    console.log("formdata ui is",loaderData);

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
