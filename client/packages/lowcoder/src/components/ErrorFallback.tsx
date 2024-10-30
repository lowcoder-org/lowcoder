import Flex from "antd/es/flex";
import { WarningIcon } from "lowcoder-design";

const ErrorFallback = (props: {
  heading?: string,
  buttonText?: string,
  onButtonClick?: () => void,
}) => (
  <Flex align="center" justify="center" vertical style={{
    height: '90vh',
    width: '400px',
    margin: '0 auto',
  }}>
    <WarningIcon width={'100px'} height={'100px'} />
    <h1 style={{marginTop: '20px', marginBottom: '20px' }}>
      {Boolean(props.heading)  ? props.heading : 'Oops, Something went wrong!'}
    </h1>
    <button
      onClick={() => {
        if(props.onButtonClick) {
          return props?.onButtonClick();
        }
        window.location.reload();
      }}
      style={{
        background: '#4965f2',
        border: '1px solid #4965f2',
        color: '#ffffff',
        borderRadius:'6px',
        fontSize: '16px',
        padding: '10px 28px',
    }}>
      {Boolean(props.buttonText)  ? props.buttonText : 'Reload'}
    </button>
  </Flex>
);

export default ErrorFallback;