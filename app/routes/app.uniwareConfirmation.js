import React, { useState, useEffect, useRef } from "react";
import { Button, TextField, Card, Layout } from "@shopify/polaris";
import { Form, useLoaderData, Link,useFetcher } from "@remix-run/react";
import { json, redirect as redirectRemix } from "@remix-run/node";
import { authenticate } from "../shopify.server";
// import { getShopifyPlanDetails } from "../services/apiClient.server";
// import { useActionData } from "@remix-run/react";
// import { useAppBridge } from "@shopify/app-bridge-react";
// import { Redirect } from "@shopify/app-bridge/actions";
// import { getLocationForShop } from '../services/apiClient.server';
// import { generateTenantCode} from '../services/signUpService.server';
// import { getSharedState} from "../services/signUpService.server";
import { getConfirmationUrl } from "../services/signUpService.server";

export const loader = async ({ request }) => {
    const {session, admin, redirect} = await authenticate.admin(request);
    const url = getConfirmationUrl(); 
    console.log("Shared state confirmation URL is: ",url) ;
    redirect(url.url,{target:"_parent"})
    // return json({ shopDetails: JSON.stringify(shopPlanDetails.data) });
};
