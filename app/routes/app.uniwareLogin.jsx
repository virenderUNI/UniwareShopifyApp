import { Button, TextField, Card, Layout } from '@shopify/polaris';
import { Form, Links, useLoaderData, Link } from '@remix-run/react';
import { json } from '@remix-run/node';
import { useEffect, useRef, useState } from 'react';
import { authenticate } from '../shopify.server';
import { getShopifyPlanDetails } from '../services/apiClient';
import { useActionData } from '@remix-run/react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import { redirect as redirectRemix } from '@remix-run/node' ;
import { createUniwareLoginSession } from '../services/loginService.server';


export const loader = async ({ request }) => {
  const { session, admin, redirect } = await authenticate.admin(request);

  const shopPlanDetails = await getShopifyPlanDetails(admin);
  if (shopPlanDetails.data.shop.plan.shopifyPlus) {
    throw redirect("/app/denyLogin")
  }
  console.log("checking if console logging is working");
  return json({ "shopDetails": JSON.stringify(shopPlanDetails.data) });
};

export const action = async ({ request }) => {

  const { session, admin, redirect } = await authenticate.admin(request);

  const formData = await request.formData();
  const tenantCode = formData.get('tenantCode');
  const username = formData.get('username');
  const password = formData.get('password');

  console.log("tenantCode is"  + tenantCode)

  const response = await createUniwareLoginSession(tenantCode, username, password, admin, session);
  if(response.successful) {
    if(response.data.confirmationUrl) {
      
      return {successful:true,"confirmationUrl": response.data.confirmationUrl}
    }
    else if(response.data.chargeId){
      return redirect(`/app/processChargeCreation?chargeId=${response.data.charge_id}`)
    }
  }
  console.log("response is ",response.error);
  return response;

};

export default function Login() {
  const [tenantCode, setTenantCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const actionData = useActionData();
  const loaderData = useLoaderData();
  const linkRef = useRef(null);


  const shopify = useAppBridge();
  const redirect = Redirect.create(shopify);


  useEffect(() => {
    if (actionData && actionData.confirmationUrl) {
      if (linkRef.current) {
        linkRef.current.click(); // Trigger the click on the Link
      }
    }
  }, [actionData]);


  const redirectToConfirmation = () => {
    window.open('https://bhagv.myshopify.com/admin/charges/154167705601/27367243928/RecurringApplicationCharge/confirm_recurring_application_charge?signature=BAh7BzoHaWRsKwiYADdfBgA6EmF1dG9fYWN0aXZhdGVU--9f312e9ad352e218f515022e6c9e1042f1817ce0');
  };

  const confirmationUrl = actionData?.confirmationUrl || '';

  return (
    <Layout>
      <Layout.Section>
        <Card title="Login" sectioned>
          <Form method="post">
            <TextField
              label="Username"
              value={username}
              onChange={(value) => setUsername(value)}
              type="text"
              name="username"
            />
            <TextField
              label="Tenant"
              value={tenantCode}
              onChange={(value) => setTenantCode(value)}
              type="text"
              name="tenantCode"
            />
            <TextField
              label="Password"
              value={password}
              onChange={(value) => setPassword(value)}
              type="password"
              name="password"
            />
            <Button submit>Login</Button>
          </Form>
          {/* <button onClick={redirectToConfirmation}>Go to Confirmation</button> */}
          <Link url={confirmationUrl} ref={linkRef} style={{ display: 'none' }} target='_top'>
            Go to Confirmation
          </Link>
          {/* <Link to={actionData.confirmationUrl} ref={linkRef} style={{ display: 'none' }}>
            Go to Confirmation
          </Link> */}
          {actionData?.confirmationUrl && <p>{actionData.confirmationUrl}</p>}
          {loaderData?.shopDetails && <p>{loaderData.shopDetails}</p>}
        </Card>
      </Layout.Section>
    </Layout>
  );
}
