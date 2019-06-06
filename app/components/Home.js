// @flow
import React, { Component } from 'react';
import routes from '../constants/routes';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className="home" data-tid="container">
        <h2>Home</h2>
      </div>
    );
  }
}
