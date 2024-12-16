import { useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import {
    Page,
    Layout,
    Text,
    Card,
    Button,
    BlockStack,
    Box,
    List,
    Link,
    InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { checkUniwareSession } from "../services/uniwareService.server";

export const loader = async ({ request }) => {
    const { session, redirect } = await authenticate.admin(request);
    const response = await checkUniwareSession(session.shop);

    console.log("Received action 2:", response.redirectUrl);

    if(response.redirectUrl != null) {
        console.log("this should redirect");
        return redirect(response.redirectUrl)
    }

    return redirect("/app/uniwareLogin");

};