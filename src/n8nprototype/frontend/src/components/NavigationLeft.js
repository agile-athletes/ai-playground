import './NavigationLeft.css';
import WorkflowButton from './WorkflowButton';

const NavigationLeft = ({workflows, selectWorkflow}) => {

    return (
        <nav className="navigation-left">
            <ul>
                {workflows.map((workflow) => (
                    <li key={workflow.id}>
                        <WorkflowButton
                            workflow={workflow}
                            selectWorkflow={selectWorkflow}
                        />
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default NavigationLeft;
