import { json, useLoaderData } from '@remix-run/react';
import { Layout, Card } from '@shopify/polaris';
import { authenticate } from '../shopify.server';
import { buildShopifyChannelUniware } from '../services/channelService.server';

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const requestUrl = new URL(request.url);
  const chargeId = requestUrl.searchParams.get('charge_id');
  const response = await buildShopifyChannelUniware(session.shop, session.accessToken);

  return json({ url: request.url, chargeId });
};

export default function ChannelPage() {
  const loaderData = useLoaderData();

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh', // Full viewport height
      width: '100%', // Full width
    },
    image: {
      width: '80%',
      height: '80%',
      objectFit: 'contain', // Ensures the image maintains its aspect ratio
    },
  };

  return (
    <div style={styles.container}>
      <img src="/images/landingU.png" alt="Centered Image" style={styles.image} />
    </div>
  );
}
