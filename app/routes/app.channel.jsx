// ChannelPage.jsx
import { json, useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Card, Layout, Page, ProgressBar, Text } from '@shopify/polaris';
// import { checkJobStatus, updateStatusInMongo } from '~/utils/api';
import { authenticate } from '../shopify.server';
import { buildShopifyChannelUniware } from '../services/channelService';


export const loader = async ({ request }) => {

    const { session } = await authenticate.admin(request);
    const requestUrl = new URL(request.url)
    const chargeId = requestUrl.searchParams.get("charge_id");
    const response = await buildShopifyChannelUniware(session.shop,session.accessToken);
    
    return json({ "url": request.url, "chargeId": chargeId })

}

export default function ChannelPage() {
    const loaderData = useLoaderData();
    // const [status, setStatus] = useState(initialStatus);
    // const [progress, setProgress] = useState(0);
    // const shopifyChannelName = 'Your Channel Name'; // Replace with your actual variable
    // const keyValuePairs = {
    //     key1: 'Value1',
    //     key2: 'Value2',
    //     key3: 'Value3',
    //     key4: 'Value4',
    // };

    // useEffect(() => {
    //     if (status === 'INITIATED') {
    //         const intervalId = setInterval(async () => {
    //             const statusResponse = await checkJobStatus();
    //             const newStatus = statusResponse.status;

    //             if (newStatus === 'COMPLETED') {
    //                 setStatus('COMPLETED');
    //                 setProgress(100);
    //                 await updateStatusInMongo('COMPLETED'); // Stop further polling
    //                 clearInterval(intervalId);
    //             } else {
    //                 setProgress((prev) => Math.min(prev + 20, 100)); // Simulate progress
    //             }
    //         }, 5000); // Polling every 5 seconds

    //         return () => clearInterval(intervalId);
    //     }
    // }, [status]);

    return (
        // <Page title="Channel Integration">
        //     {status !== 'COMPLETED' ? (
        //         <Card>
        //             <ProgressBar progress={progress} />
        //             <Text variant="bodyMd">Status: {status === 'INITIATED' ? 'Work in Progress' : status}</Text>
        //         </Card>
        //     ) : (
        //         <Card title={shopifyChannelName}>
        //             {Object.entries(keyValuePairs).map(([key, value]) => (
        //                 <Text variant="bodyMd" key={key}>
        //                     {key}: {value}
        //                 </Text>
        //             ))}
        //         </Card>
        //     )}
        // </Page>
        <Layout>
            <Layout.Section>
                <Card title="Login" sectioned>
                    {/* <Form method="post">
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
          {actionData?.confirmationUrl && <p>{actionData.confirmationUrl}</p>} */}
                    {loaderData?.url && <p>{loaderData.url} + {loaderData.chargeId}</p>}
                </Card>
            </Layout.Section>
        </Layout>
    );
}
