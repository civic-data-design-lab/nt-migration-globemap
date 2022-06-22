import React, {useEffect, useState} from 'react';

export default function RangeInput({ max, value, animationSpeed, onChange, formatLabel, isPlaying, reset}) {
  
  
  useEffect(() => {
    let animation;

    if (isPlaying) {
      animation = requestAnimationFrame(() => {
        let nextValue = value + animationSpeed;
         onChange(nextValue);
      }); 
    }


    if(!isPlaying && reset){
      reset = false
      onChange(0);
    }
    

    return () => animation && cancelAnimationFrame(animation);
    
  });
  


  return (
    <>

    </>
  );

}


