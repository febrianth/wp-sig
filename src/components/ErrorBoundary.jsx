import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Card className="max-w-lg mx-auto mt-8">
                    <CardHeader>
                        <CardTitle className="text-destructive">Something went wrong</CardTitle>
                        <CardDescription>
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={this.handleReset}>Try Again</Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
