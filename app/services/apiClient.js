import { json } from '@remix-run/node';
import axios from 'axios';

export async function authenticateUser(username, password, tenantCode) {
  console.log("password is", password)
  console.log("username is ",username)
  console.log("tenantCode is ",tenantCode);
  const serverUrl = `https://${tenantCode}.unicommerce.com/oauth/token`;
  try {
    const uniwareAuthResponse = await axios.get(serverUrl,
      {
        headers: {
          'Content-Type': 'Application/json',      
        },
        params : {
          'grant_type': "password",
          'client_id': "my-trusted-client",
          'username': username,
          'password': password
        },
        timeout: 12000,
        validateStatus: (status) => status >= 200 && status < 600
      }
    )
    console.log("uniwareAuth response is ",JSON.stringify(uniwareAuthResponse.data));
    return { data: uniwareAuthResponse.data, status: uniwareAuthResponse.status };

  }
  catch (error) {
    if (error.response && error.response.headers['content-type'] != 'application/json') {
      return {
        data: { errorMessage: error },
        status: 502
      };
    }
    if (error.response) {
      // Server responded with a status other than 2xx
      const errorMessage = error.response.data.errorMessage || 'We are unable to verify your credentials. Its on us.';
      return json({ error: errorMessage }, { status: error.response.status });
    } else if (error.request) {
      // No response was received
      return json({ error: 'No response received from server. Please try again later.' }, { status: 504 });
    } else {
      // Something happened in setting up the request that triggered an Error
      return json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
    }
  }


}

export async function getLocationForShop(shop, accessToken) {
  console.log("finding location for this shop");
  const response = await axios.get(`https://${shop}/admin/api/2023-04/locations.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken
    }
  });

  console.log("location api response is ",JSON.stringify(response.data));

  return response;
}

export async function getShopifyPlanDetails(admin) {
  try {
    const response = await admin.graphql(
      `#graphql
              query shopInfo {
                shop {
                  name
                  url
                  myshopifyDomain
                  plan {
                    displayName
                    partnerDevelopment
                    shopifyPlus
                  }
                }
              }`
    );
    
    return response.json();

  } catch (error) {
    console.error('Network or other error:', error);
    return {
      data: { error: 'Error from shopify. Please try again later.' },
      status: 500
    }

  }
}

export async function createApplicationRecurrentCharge(admin,session) {
  try {
    const applicationChargeResponse = await admin.graphql(
      `#graphql
        mutation createAppSubscription($name: String!, $returnUrl: URL!, $test: Boolean, $lineItems: [AppSubscriptionLineItemInput!]!) {
          appSubscriptionCreate(
            name: $name,
            returnUrl: $returnUrl,
            test: $test,
            lineItems: $lineItems
          ) {
            appSubscription {
              id
              status
              name
            }
            confirmationUrl
            userErrors {
              field
              message
            }
          }
        }`,
      {
        variables: {
          name: "Super Duper Recurring Plan",
          returnUrl: `https://${session.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/app/processChargeCreation`,
          test:true,
          lineItems: [
            {
              "plan": {
                "appRecurringPricingDetails": {
                  "price": {
                    "amount": 0.01,
                    "currencyCode": "USD"
                  },
                  "interval": "EVERY_30_DAYS"
                }
              }
            }
          ]
          
        }
      }
    );
    return applicationChargeResponse.json();
  } catch (error) {
    console.error('Network or other error:', error);
    throw error
  }
}

export function generateUniqueId() {
  // Generate a unique identifier using the current timestamp and a random value
  return 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

export async function handleApplicationCharge(admin, session) {
  try {
      const responseJson = await createApplicationRecurrentCharge(admin, session);
      console.log(responseJson);
      const userErrors = responseJson.data.appSubscriptionCreate.userErrors;

      if (userErrors.length > 0) {
          throw new Error(userErrors.map(error => error.message).join(', '));
      }

      return { "successful":true,"data":{ confirmationUrl: responseJson.data.appSubscriptionCreate.confirmationUrl ,chargeId : null}};
  } catch (error) {
      throw new Error("Error " + JSON.stringify(error));
  }
}






