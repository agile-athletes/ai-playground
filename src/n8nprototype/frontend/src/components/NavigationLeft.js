import './NavigationLeft.css';
import WorkflowButton from './WorkflowButton';

const NavigationLeft = ({ workflows, selectWorkflow }) => {
    return (
        <nav className="navigation-left">
            <ul>
                {workflows.map((workflow, index) => (
                    <li key={workflow.id} style={{ paddingLeft: `${index * 20}px` }}>
                        <WorkflowButton
                            workflow={workflow}
                            selectWorkflow={selectWorkflow}
                            index={index}
                        />
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default NavigationLeft;
