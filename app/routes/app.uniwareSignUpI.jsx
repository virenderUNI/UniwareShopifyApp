import { Button, TextField, Card, Layout } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { useActionData, useNavigate } from '@remix-run/react';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { validateEmailAndPhone } from '../services/signUpService.server';
import useSessionStorage from '../customHooks/useSessionStorage';


const styles = {
   inputContainer: {
     display: 'flex',
     flexDirection: 'column',
     justifyContent: 'space-between',
     width: '25%',
     marginBottom: '1rem',
     gap: '10px',
   },
   buttonContainer: {
     display: 'flex',
     justifyContent: 'flex-start',
     marginTop: '1rem',
   }
};


export const action = async ({ request }) => {
   const { session, admin, redirect } = await authenticate.admin(request);
   const formData = new URLSearchParams(await request.text());
   const email = formData.get('email');
   const phone = formData.get('phone');
   const response = await validateEmailAndPhone(email, phone, session.shop);
   console.log(process.env.SHOPIFY_API_KEY)
   console.log(session.accessToken);
   console.log(response);
   if (response.successful) {
       console.log("redirecting to signUpPage2 ");
       return redirect(`/app/uniwareSignUpII`); // Redirect here
 
   }
   console.log("received error", response.error);
   return json({ "successful": false, "error": response.error });
};


export default function SignUp() {
   const [email, setEmail] = useSessionStorage('email', '');
   const [phone, setPhone] = useSessionStorage('phone', '');
   const actionData = useActionData();
   const navigate = useNavigate();


   const handleSubmit = (event) => {
       event.preventDefault();
       event.target.submit();
   };
   return (
       <Layout>
           <Layout.Section>
               <Card title="Sign Up" sectioned>
              
                   <form method="post" onSubmit={handleSubmit}>
                   <div style={styles.inputContainer}>
                       <TextField
                           label="Email"
                           value={email}
                           onChange={(value) => setEmail(value)}
                           type="email"
                           name="email"
                       />
                       <TextField
                           label="Phone"
                           value={phone}
                           onChange={(value) => setPhone(value)}
                           type="tel"
                           name="phone"
                       />
                   </div>
                       <Button submit primary>Next</Button>
                   </form>
                   {/* {actionData?.error && <p>{actionData.error}</p>} */}
               </Card>
           </Layout.Section>
       </Layout>
   );
}
