import React, { useContext, useState } from 'react'
import classes from './payment.module.css'
import LayOut from '../../Components/LayOut/LayOut'
import {DataContext} from '../../Components/DataProvider/DataProvider'
import ProductCard  from '../../Components/Product/ProductCard'
import {
  useStripe,
  useElements,
  CardElement
} from "@stripe/react-stripe-js";

import CurrencyFormat from '../../Components/CurrencyFormat/CurrencyFormat'
import {axiosInstance} from "../../Api/axios";
import { ClipLoader } from 'react-spinners'
import {db} from '../../Utility/firebase';
import {useNavigate} from 'react-router-dom'
import { Type } from "../../Utility/action.type";

const Payment = () => {

    const [{ user, basket}, dispatch] = useContext(DataContext);

    const totalItem = basket?.reduce((amount, item) => {
      return item.amount + amount;
    }, 0);

    const total = basket.reduce((amount, item) => {
      return item.price * item.amount + amount;
    }, 0);

    const [cardError, setCardError] = useState(null)
    const [processing, setProcessing] = useState(false)

  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate()

const handleChange = (e) =>{
  // console.log(e);
e?.error?.message? setCardError(e?.error?.message) : setCardError("");
};

const handelPayment = async (e) => {
  e.preventDefault();

  try {
    setProcessing(true);

    // Get Client Secret from Backend
    const response = await axiosInstance({
      method: "POST",
      url: `/payment/create?total=${total * 100}`,
    });

    const clientSecret = response.data?.clientSecret;
  
    // Confirm Payment
    const { paymentIntent } = await stripe.confirmCardPayment(clientSecret,
       {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    // console.log("Payment Intent Confirmed:", paymentIntent);

    // Save Order to Firestore
    await db.collection("users").doc(user.uid).collection("orders").doc(paymentIntent.id).set({
        basket: basket,
        amount: paymentIntent.amount,
        created: paymentIntent.created,
      });
if (!user || !user.uid) {
  console.error("User is not authenticated or missing UID.");
  console.log("User Object:", user); // Log user object
  setProcessing(false);
  return;
}
// console.log("User UID:", user?.uid);
// console.log("Basket data:", basket);


    // console.log("Order Saved to Firestore");

    // Empty Basket
    dispatch({
      type: Type. EMPTY_BASKET,
    });

     setProcessing(false);
     navigate("/orders", {state: {msg: "you have placed new order"}});
  } catch (error) {
    console.log( error);
    setProcessing(false);
  }
};


  return (
    <LayOut>
      {/* header */}

      <div className={classes.payment__header}>
        Checkout ({totalItem}) items
      </div>

      {/* payment method */}
      <section className={classes.payment}>
        {/* address */}
        <div className={classes.flex}>
          <h3>Delivery Address</h3>
          <div>
            <div>{user?.email}</div>
            <div>123 React lane</div>
            <div>chicago, IL</div>
          </div>
        </div>

        <hr />

        {/* product */}
        <div className={classes.flex}>
          <h3>Review items and delivery</h3>
          <div>
            {basket?.map((item) => (
              <ProductCard product={item} flex={true} />
            ))}
          </div>
        </div>
        <hr />

        {/* card form */}
        <div className={classes.flex}>
          <h3>Payment Methods</h3>
          <div className={classes.payment__card__container}>
            <div className={classes.payment__details}>
              <form onSubmit={handelPayment}>
                {/* error */}
                {cardError && (
                  <small style={{ color: "red" }}>{cardError}</small>
                )}
                <CardElement onChange={handleChange} />

                {/* price */}
                <div className={classes.payment__price}>
                  <div>
                    <span style={{ display: "flex", gap: "10px" }}>
                      <p> Total Order| </p>
                      <CurrencyFormat amount={total} />
                    </span>
                  </div>
                  <button type="submit">
                    {
                      processing? (
                        <div className={classes.loading}>
                          <ClipLoader color="gray" size={14}/>
                          <p>please Wait...</p>
                        </div>
                      ):(
                      "Pay Now"
                   ) }
                    </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </LayOut>
  );
}

export default Payment