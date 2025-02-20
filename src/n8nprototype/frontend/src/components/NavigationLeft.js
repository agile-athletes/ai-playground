import './NavigationLeft.css';
import WorkflowButton from './WorkflowButton';

const NavigationLeft = ({workflows, setWebhookUrl}) => {

    return (
        <nav className="navigation-left">
            <ul>
                {workflows.map((attention) => (
                    <li key={attention.id}>
                        <WorkflowButton
                            attention={attention}
                            setWebhookUrl={setWebhookUrl}
                        />
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default NavigationLeft;
