import { json, redirect } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { Button, TextField, Card, Layout } from '@shopify/polaris';
import { useEffect, useState } from 'react';
import { useActionData, useLoaderData } from '@remix-run/react';
import { generateTenantCode, validateTenantCode } from '../services/signUpService.server';
import useSessionStorage from '../customHooks/useSessionStorage';
import { getLocationForShop } from '../services/apiClient.server';

export const loader = async ({ request }) => {

    const {session, admin} = await authenticate.admin(request);
    const locationResponse = await getLocationForShop(session.shop,session.accessToken);
    const phone = locationResponse.data.locations[0].phone;
    const response = await generateTenantCode(session.shop,phone);
    console.log(response)
    if(response.successful)
    {
        const tenantCode = response.data.tenantCode;
        console.log("tenantCode is" , tenantCode)
        return json({ tenantCode });
    }
    return json({tenantCode:""})
};

export const action = async ({ request }) => {
    const {session, admin,redirect} = await authenticate.admin(request);
    const formData = new URLSearchParams(await request.text());
    const tenantCode = formData.get('tenantCode');

    const response = await validateTenantCode(session.shop,tenantCode);

    if(response.successful = true) {
        console.log("new generated tenantCode should be",response.tenantCode);
        return redirect('/app/uniwareSignUpIII'); 
    }
    return json({ successful: false,"error":response.error });
};

export default function uniwareSignUpSignUpII() {
    const loaderData = useLoaderData();
    const [tenantCode, setTenantCode] = useSessionStorage('tenantCode', loaderData.tenantCode || '');
    const actionData = useActionData();

    useEffect(() => {
        if (actionData?.tenantCode  ) {
            setTenantCode(actionData.phone);
        }
    }, [actionData, setTenantCode]);

    return (
        <Layout>
            <Layout.Section>
                <Card title="Enter Tenant Code" sectioned>
                    <form method="post">
                        <TextField
                            label="Tenant Code"
                            value={tenantCode}
                            onChange={(value) => setTenantCode(value)}
                            type="text"
                            name="tenantCode"
                        />
                        <Button submit>Next</Button>

                    </form>
                    {actionData?.error && <p>{actionData.error}</p>}
                </Card>
            </Layout.Section>
        </Layout>
    );
}
