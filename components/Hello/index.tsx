"use client";
import React, { useEffect, useState} from "react";
import api from "@/services/api";

const Hello: React.FC = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get('/v1')
      .then((res) => {
        setMessage(res.data.message);
      })
      .catch((error) => {
        console.log(`oops`, error);
      });
  }, [])

  return <h1>{message}</h1>;
}

export default Hello;
