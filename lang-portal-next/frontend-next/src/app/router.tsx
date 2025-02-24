import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
// ...existing code...

function AppRouter() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        {/* Add more routes as needed */}
        {/* ...existing code... */}
      </Switch>
    </Router>
  );
}

export default AppRouter;
