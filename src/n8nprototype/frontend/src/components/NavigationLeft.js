import './NavigationLeft.css';
import WorkflowButton from './WorkflowButton';

const NavigationLeft = ({workflows, setWebhookUrl}) => {

    return (
        <nav className="navigation-left">
            <ul>
                {workflows.map((workflow) => (
                    <li key={workflow.id}>
                        <WorkflowButton
                            workflow={workflow}
                            setWebhookUrl={setWebhookUrl}
                        />
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default NavigationLeft;
