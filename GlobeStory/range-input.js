/* global requestAnimationFrame, cancelAnimationFrame */
import React, {useEffect, useState} from 'react';
// import {styled, withStyles} from '@material-ui/core/styles';
// import Slider from '@material-ui/core/Slider';
// import Button from '@material-ui/core/IconButton';
// import PlayIcon from '@material-ui/icons/PlayArrow';
// import PauseIcon from '@material-ui/icons/Pause';





// 
// const SliderInput = withStyles({
//   root: {
//     marginLeft: 12,
//     opacity: 0,
//     width: '40%'
//   },
//   valueLabel: {
//     '& span': {
//       whiteSpace: 'nowrap',
//       background: 'none',
//       color: '#fff'
//     }
//   }
// })(Slider);

export default function RangeInput({min, max, value, animationSpeed, onChange, formatLabel}) {
  const [isPlaying, setIsPlaying] = useState(true);
  

  // prettier-ignore
  useEffect(() => {
    let animation;

    if (isPlaying) {
      animation = requestAnimationFrame(() => {
        let nextValue = value + animationSpeed;
      //   if (nextValue > max) {
//           nextValue = min;
//         }
        onChange(nextValue);
      });
 
    }
    


    return () => animation && cancelAnimationFrame(animation);
    
  });
  


  return (
    <>

       

      />
    </>
    
  );

}


