import React, { useState, useEffect, useRef } from "react";
import { Button, TextField, Card, Layout } from "@shopify/polaris";
import { Form, useLoaderData, Link } from "@remix-run/react";
import { json, redirect as redirectRemix } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useActionData } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import  {validateEmailAndPhone} from "../services/signUpService.server";
import { getShopifyPlanDetails } from "../services/apiClient.server";
import { setSharedState } from "../services/signUpService.server";


export const loader = async ({ request }) => {
    setSharedState({ shouldRunSignUpIILoader: '1' });
   
    const { session, admin ,redirect } = await authenticate.admin(request);
    const shopPlanDetails = await getShopifyPlanDetails(admin);
    if (shopPlanDetails.data.shop.plan.shopifyPlus) {
      throw redirectRemix("/app/denyLogin");
    }
    return json({ shopDetails: JSON.stringify(shopPlanDetails.data) });
};

  
export const action = async ({ request }) => {
    const { session, admin, redirect } = await authenticate.admin(request);
    const formData = new URLSearchParams(await request.text());
    const email = formData.get('email');
    const phone = formData.get('phone');
    const actionType = formData.get("actionType"); 
    if(actionType == 'signup'){
        const response = await validateEmailAndPhone(email, phone, session.shop);
        console.log(process.env.SHOPIFY_API_KEY)
        console.log(session.accessToken);
        console.log(response);
        if (response.successful) {
            console.log("redirecting to signUpPage2 ");
            return redirect(`/app/uniwareSignUpII`); // Redirect here
    
        }else {
            return json({});
        }
   } else if(actionType == 'login'){
     return redirect(`/app/uniwareLogin`);
   }
    console.log("received error", response.error);
    return json({ "successful": false, "error": response.error });
 };
 
 
export default function uniwareSignUpSignUpI() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const actionData = useActionData();
  const formRef = useRef(); 
  const loaderData = useLoaderData();
  const linkRef = useRef(null);

  const shopify = useAppBridge();
  const redirect = Redirect.create(shopify);

  const handleLoginClick = (e) => {
    e.preventDefault(); 
    console.log("Log In button clicked"); 
    const actionTypeInput = formRef.current.querySelector('input[name="actionType"]');
    actionTypeInput.value = "login";
    formRef.current.submit();
  };

  useEffect(() => {
    if (actionData && actionData.confirmationUrl) {
      if (linkRef.current) {
        linkRef.current.click(); // Trigger the click on the Link
      }
    }
  }, [actionData]);

  return (
    <div style={styles.container}>
      <div style={styles.leftSection}>
        <div style={styles.textBelowLogo}>
          <span style={styles.line1}>E-commerce selling</span>
          <br />
          <span style={styles.line2}>SIMPLIFIED</span>
          <br />
          <span style={styles.line3}>across the globe</span>
        </div>

        <p style={styles.trustedText}>Trusted by 3600+ Brands</p>
        <div style={styles.brandLogos}>
          <div>
            <img src="/images/tcns.jpeg" alt="TCNS" style={styles.logo} />
          </div>
          <div>
            <img src="/images/lenskart.png" alt="Lenskart" style={styles.logo} />
          </div>
          <div>
            <img src="/images/bestseller.png" alt="Bestseller" style={styles.logo} />
          </div>
          <div>
            <img src="/images/uc.png" alt="Boat" style={styles.logo} />
          </div>
          <div>
            <img src="/images/mamaearth.png" alt="Mamaearth" style={styles.logo} />
          </div>
          <div>
            <img src="/images/boat.png" alt="Boat" style={styles.logo} />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div style={styles.rightSection}>
        <div style={styles.header}>
          <img src="/images/logo.svg" alt="Unicommerce Logo" style={{ width: "120px" }} />
          <h2 style={styles.h2}>Welcome to Unicommerce</h2>
          <p style={styles.instruction}>Sign Up below to create a new account.</p>
        </div>

        <Form method="post" ref={formRef}  style={styles.formContainer}>
          <input type="hidden" name="actionType" value="signup" />

          <TextField
            label={<span style={styles.customLabel}>Email</span>}
            value={email}
            onChange={(value) => setEmail(value)}
            placeholder="Enter your email"
            type="text"
            name="email"
            autoComplete="email"
          />
          <TextField
            label={<span style={styles.customLabel}>Phone</span>}
            value={phone}
            onChange={(value) => setPhone(value)}
            placeholder="Enter your phone"
            type="phone"
            name="phone"
          />
          <Button submit primary>Next</Button>
        </Form>
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          Already have an account?{" "}
          <button
            style={{
              background: "none",
              border: "none",
              color: "#1F87C2",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={handleLoginClick}
          >
            Log In
          </button>
        </p>
        <div style={styles.socialMedia}>
            <a href="https://www.linkedin.com/company/unicommerce/?originalSubdomain=in" target="_blank" rel="noopener noreferrer">
                <img src="/images/linkedin.png" alt="LinkedIn" style={styles.socialIcon} />
            </a>
            <a href="https://www.facebook.com/unicommerce/" target="_blank" rel="noopener noreferrer">
                <img src="/images/facebook.png" alt="Facebook" style={styles.socialIcon} />
            </a>
            <a href="https://www.youtube.com/channel/UCxghboEldMtQRVJxqCq6UHg" target="_blank" rel="noopener noreferrer">
                <img src="/images/youtube.jpg" alt="YouTube" style={styles.socialIcon} />
            </a>
            <a href="https://www.instagram.com/unicommerce_esolutions/?hl=en" target="_blank" rel="noopener noreferrer">
                <img src="/images/instagram.jpg" alt="Twitter" style={styles.socialIcon} />
            </a>
            <a href="https://x.com/Unicommerce_?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor" target="_blank" rel="noopener noreferrer">
                <img src="/images/twitter.jpg" alt="Twitter" style={styles.socialIcon} />
            </a>
           
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundImage: `
      linear-gradient(
        to bottom right,
        #1F87C2 0%,
        #1F87C2CC 30%,
        #ACC90D80 70%,
        #ACC90D 100%
      ),
      url('/images/warehouse.jpg')
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    justifyContent: "space-between",
    alignItems: "flex-start",
    color: "#000",
    padding: "1rem",
  },
  leftSection: {
    width: "50%",
    maxWidth: "600px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginTop: "1rem",
    marginLeft: "3rem",
  },
  textBelowLogo: {
    // height: "168px",
    width: "80%",
    fontWeight: "500",
    lineHeight: "3rem",
    fontSize: "3rem",
    marginTop: "2rem",
  },
  trustedText: {
    fontSize: "1.5rem",
    fontWeight: 500,
    marginTop: "1rem",
  },
  brandLogos: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)", 
    gap: "0.5rem", 
    width: "480px", 
    height: "85px",
    borderRadius: "8px",
    overflow: "hidden", 
    alignItems: "center", 
    justifyItems: "center", 
    backgroundColor: "#f9f9f9", 
    padding: "0.5rem", 
    marginTop: "1rem"
  },
  logo: {
    maxWidth: "100%", 
    maxHeight: "100%", 
    objectFit: "contain", 
  },
  socialMedia: {
    position: "absolute",
    bottom: "2rem", // Positions 2rem from the bottom of rightSection
    left: "50%", // Positions it horizontally in the middle
    transform: "translateX(-50%)", // Adjusts for centering
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
  },
  socialIcon: {
    width: "30px !important",
    height: "26px !important",
    objectFit:"contain",
    cursor: "pointer",
  },
  rightSection: {
    width: "40%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "2rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column", // Ensures child elements stack vertically
    // justifyContent: "space-between",
    position: "relative"
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "0.5rem",
    marginBottom: "2rem",
  },
  h2: {
    fontWeight: 600,
  },
  instruction: {
    color: "#757575",
  },
  customLabel: {
    color: "#757575",
    fontWeight: "700",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  }
};
