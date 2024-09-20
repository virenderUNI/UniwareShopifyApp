
import { json } from "@remix-run/node";
import { findShopifyUniwareTenant, findUniwareCred } from "../mao/uniwareSessionMao.server";
import axios from "axios";

export async function checkUniwareSession(shopDetails) {
  const appUniwareCredResponse = await findUniwareCred(shopDetails);

  if (appUniwareCredResponse.successful) {
    const appUniwareCred = appUniwareCredResponse.data;
    const currentTimestamp = new Date().getTime();

    if (appUniwareCred.expiresAt - currentTimestamp > 0) {
      console.log("this is not evaluated")
      return { "redirectUrl": "/app/channel", "tenantCode": appUniwareCred.tenantCode };
    }
    else {
      console.log("this is evaluated")
      return { "redirectUrl": "/app/uniwareLogin", "tenantCode": appUniwareCred.tenantCode };
    }
  }
  else {
    console.log("looking for tenant details")
    const shopifyUniwareTenant = await findShopifyUniwareTenant(shopDetails);
    if (shopifyUniwareTenant.successful) {
      if (shopifyUniwareTenant.data.tenantSetupStatus === "RUNNING") {
        return { "tenantCode": shopifyUniwareTenant.data.tenantCode, "redirectUrl": `/app/channel?charge_id=${shopifyUniwareTenant.data.chargeId}` }
      }
    }
    return { "tenantCode": "abc", "redirectUrl": null }
  }
}

export async function checkUserAvailability(email, phone) {
  console.log("checking user availability");
  const serviceUrl = "https://auth.unicommerce.com/data/service/user/checkAvailability";
  const requestHeaders = {
    "Content-Type": "application/json"
  };
  const requestBody = { email: email, mobile: phone };

  console.log("checkUserAvailability requestBody", requestBody);

  try {
    const response = await axios.post(serviceUrl, requestBody, { headers: requestHeaders });
    const responseJson = response.data;
    console.log("availability Response is", JSON.stringify(responseJson));
    return responseJson.successful === true ? { successful: true, message: "Good to go" } : { successful: false, error: "Already in use" };
  } catch (error) {
    console.log("checkUserAvailability error response", error);
    return { successful: false, message: error.message };
  }
}

export async function checkAccessUrlAvailability(tenantCode, phone) {
  phone = phone.split(" ").join("");
  console.log("reading tenantCode", tenantCode, phone);

  if (!tenantCode) {
    return { successful: false, message: "Tenant code is required" };
  }

  const serviceUrl = "https://services.unicommerce.com/client/accessUrl/checkAvailability";
  const requestHeaders = {
    "Content-Type": "application/json"
  };

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const requestBody = {
        value: tenantCode + ".unicommerce.com"
      };

      const response = await axios.post(serviceUrl, requestBody, { headers: requestHeaders });
      console.log("response", JSON.stringify(response.data));
      const responseJson = response.data;

      if (responseJson.successful) {
        return { successful: true, tenantCode: tenantCode };
      } else if (responseJson.errors && responseJson.errors.length > 0) {
        return {
          successful: false,
          message: responseJson.errors[0].description
        };
      }

      // Update tenantCode with a portion of the phone number or random digits
      tenantCode = phone && attempt <= 4
        ? tenantCode + phone.substring(10 - attempt * 2, 12 - attempt * 2)
        : tenantCode + Math.floor(Math.random() * 90 + 10);

    } catch (error) {
      console.log("checkAccessUrlAvailability error response", error);
      return {
        successful: false,
        message: error.message
      };
    }
  }

  return { successful: false, message: "Failed to find an available tenant code" };
}

export async function createShopifyChannelUniware(params) {

  console.log("try creating a new channel on uniware");
  console.log(params)

  const appUniwareAuth = await findUniwareCred(params.get("hostname"));
  const createShopifyChannelUniwareUrl = `https://${appUniwareAuth.data.tenantCode}.unicommerce.com/services/rest/v1/channel/create`
  const requestHeaders = {
    "Content-Type": "application/json",
    "Authorization": `bearer ${appUniwareAuth.data.accessToken}`
  }
  const channelCreationRequest = {
    "channel": {
        "sourceCode": "SHOPIFY",
        "channelName": "SHOPIFY"
    },
    "channelConnectors": [
        {
            "channelCode": "SHOPIFY",
            "name": "SHOPIFY_API",
            "channelConnectorParameters": [
                {
                    "name": "hostname",
                    "value": params.get("hostname")
                },
                {
                    "name": "apiKey",
                    "value": params.get("apiKey")
                },
                {
                    "name": "locationId",
                    "value": params.get("locationId")
                },
                {
                    "name": "password",
                    "value": params.get("password")
                },
                {
                    "name": "Email",
                    "value": params.get("Email")
                },
                {
                    "name": "prefix",
                    "value": params.get("prefix")
                },
                {
                    "name": "trackingUrl",
                    "value": params.get("trackingUrl")
                }
            ]
        }
    ]
}
  try {
    console.log("hitting uniware api", createShopifyChannelUniwareUrl, requestHeaders, channelCreationRequest);
    const response = await axios.post(createShopifyChannelUniwareUrl, channelCreationRequest, { headers: requestHeaders });
    console.log("response is", JSON.stringify(response.data));
    if (response.data.successful) {
      return {"successful":true,"data":response.data};
    }
    return response.data;
  }
  catch (error) {
    console.log(JSON.stringify(error.response.data))
    return { successful:false, error: `Unable to add channel connector details to Uniware due to some Internal Server Error. ${JSON.stringify(error.message)}` }
  }

}

export async function getShopifyChannelDetailsUniware(params) {

  const appUniwareAuth = findUniwareCred(params.get("hostname"));
  const serviceUrl = `https://${appUniwareAuth.tenantCode}.unicommerce.com/services/rest/v1/channel/getChannelDetails`
  const requestHeaders = {
    "Content-Type": "application/json",
    "Authorization": `bearer ${appUniwareAuth.accessToken}`
  }
  const requestBody =
  {
    "channelCode": params.get("channelCode")
  }

  try {
    const response = await axios.post(serviceUrl, requestBody, { headers: requestHeaders });
    console.log("response", JSON.stringify(response.data));
    if (response.data.successful) {
      return response.data;
    }
    else {
      return json({ "statusCode": response.status, "successful": false, "error": "Unable to fetch channel Details from Uniware" })
    }
  }
  catch (error) {
    return json({ "successful": false, "error": "Unable to fetch channel Details from Uniware" })
  }

}

export async function addChannelConnectorUniware(params,channelCode) {

  const appUniwareAuth = await findUniwareCred(params.get("hostname"));
  const addChannelConnectorUrl = `https://${appUniwareAuth.data.tenantCode}.unicommerce.com/services/rest/v1/channel/addChannelConnector`
  const requestHeaders = {
    "Content-Type": "application/json",
    "Authorization": `bearer ${appUniwareAuth.data.accessToken}`
  }
  const addChannelConnectorRequest =
  {
    channelConnector: {
      channelCode: channelCode,
      name: "SHOPIFY_API",
      channelConnectorParameters: [
        {
          name: "hostname",
          value: params.get("hostname")
        },
        {
          name: "apiKey",
          value: params.get("apiKey")
        },
        {
          name: "locationId",
          value: params.get("locationId")
        },
        {
          name: "password",
          value: params.get("password")
        },
        {
          name: "EMAIL",
          value: params.get("Email")
        },
        {
          name: "prefix",
          value: params.get("prefix")
        },
        {
          name: "trackingUrl",
          value: params.get("trackingUrl")
        }
      ]
    }
  }

  try {
    console.log(addChannelConnectorUrl,requestHeaders,addChannelConnectorRequest);
    const response = await axios.post(addChannelConnectorUrl, addChannelConnectorRequest, { headers: requestHeaders });
    console.log("response", JSON.stringify(response.data));
    if (response.data.successful) {
      return response.data;
    }
    else {
      return { "successful": false, "statusCode": response.status, "error": "Unable to update channel Connectors on uniware" }
    }
  }
  catch (error) {
    return { "successful": false, "error": "Unable to add channel connector details to Uniware due to some Internal Server Error." }
  }


}

export async function authenticateUser(username, password, tenantCode) {
  console.log("password is", password)
  console.log("username is ", username)
  console.log("tenantCode is ", tenantCode);
  const serverUrl = `https://${tenantCode}.unicommerce.com/oauth/token`;
  try {
    const uniwareAuthResponse = await axios.get(serverUrl,
      {
        headers: {
          'Content-Type': 'Application/json',
        },
        params: {
          'grant_type': "password",
          'client_id': "my-trusted-client",
          'username': username,
          'password': password
        },
        timeout: 12000,
        validateStatus: (status) => status >= 200 && status < 600
      }
    )
    console.log("uniwareAuth response is ", JSON.stringify(uniwareAuthResponse.data));
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

export async function createNewUniwareTenantShopifyChannel(shopDetails, accessToken) {

  const shopifyUniwareTenantResponse = await findShopifyUniwareTenant(shopDetails);

  if (!shopifyUniwareTenantResponse.successful) {
    return { successful: false }
  }

  const shopifyUniwareTenantDetails = shopifyUniwareTenantResponse.data;
  const serviceUrl = "https://services.unicommerce.com/client/create/do";
  const requestHeaders = {
    "content-type": "application/json",
    "cache-control": "no-cache"
  };


  const requestBody = {
    tenantCode: shopifyUniwareTenantDetails.tenantCode,
    companyName: shopifyUniwareTenantDetails.tenantCode,
    name: shopifyUniwareTenantDetails.tenantCode,
    email: shopifyUniwareTenantDetails.email,
    password: shopifyUniwareTenantDetails.phone,
    phone: shopifyUniwareTenantDetails.phone,
    tenantType: "STANDARD",
    address: shopifyUniwareTenantDetails.address1,
    address2: shopifyUniwareTenantDetails.address2,
    city: shopifyUniwareTenantDetails.city,
    pincode: shopifyUniwareTenantDetails.pincode,
    state: shopifyUniwareTenantDetails.state,
    country: shopifyUniwareTenantDetails.country,
    mode: "TESTING",
    referrerCode: "Shopify",
    serverFamily: "StgECloud",
    minimumInvoicesApplicable: false,
    billingMode: "PREPAID",
    postpaidContract: "SHOPIFY",
    productCode: "STANDARD_SHOPIFY",
    channelRequests: [
      {
        channel: {
          sourceCode: "SHOPIFY",
          channelName: "SHOPIFY"
        },
        channelConnectors: [{
          channelCode: "SHOPIFY",
          name: "SHOPIFY_API",
          channelConnectorParameters: [
            {
              name: "apiKey",
              value: process.env.SHOPIFY_API_KEY
            },
            {
              name: "password",
              value: accessToken
            },
            {
              name: "hostname",
              value: shopDetails
            },
            {
              name: "locationId",
              value: shopifyUniwareTenantDetails.locationId
            },
            {
              name: "trackingUrl",
              value: "TRUE"
            },
            {
              name: "prefix",
              value: "prefix"
            },
            {
              name: "Email",
              value: "TRUE"
            }
          ]
        }]
      }
    ]
  };

  try {
    const response = await axios.post(serviceUrl, requestBody, { headers: requestHeaders });
    console.log("tenant creation response is ", response.data);
    return response;
  } catch (error) {
    console.log("error in tenantCreation", error)
    return { successful: false }
  }
}

export async function getUniwareTenantType(tenantCode, shopDetails) {

  console.log("tenantCode is ", tenantCode);
  const shopUniwareAuthDetails = await findUniwareCred(shopDetails);
  if (!shopUniwareAuthDetails.successful) {
    return shopUniwareAuthDetails;
  }

  const authToken = shopUniwareAuthDetails.data.accessToken;

  const requestBody = {
    "tenantCode": tenantCode
  };

  const requestHeaders = {
    "Content-Type": "application/json",
    "Authorization": `bearer ${authToken}`
  }

  const serverUrl = `https://${tenantCode}.unicommerce.com/services/rest/v1/system/tenant/getTenantDetails`;


  try {
    const uniwareTenantTypeResponse = await axios.post(serverUrl, requestBody, { headers: requestHeaders });
  
    console.log("uniwareTenantTypeResponse response is ", JSON.stringify(uniwareTenantTypeResponse.data));

    if (!uniwareTenantTypeResponse.data.successful) {
      return uniwareTenantTypeResponse.data;
    }
    return { successful: true, data: uniwareTenantTypeResponse.data.profile };

  }
  catch (error) {
    return { successful: false, error: `Error while fetch uniware tenant Type ${error.message}` }
  }

}
