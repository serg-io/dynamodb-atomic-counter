/**
 * These are just a few examples of how to use dynamodb-atomic-counter.
 * To run these examples execute the following command in your terminal:
 * 
 *    nodeunit examples.js
 * 
 * 
 * IMPORTANT: Before running these examples, create the following DynamoDB tables in your account.
 * 
 *      Table Name     Primary hash key (string)
 *    AtomicCounters            id
 *      MyCounters             name
 */

var usersLastValue,
	_ = require( 'underscore' ),
	atomicCounter = require( './atomic-counter' );

_.mixin( require('underscore.deferred') );


/**
 * dynamodb-atomic-counter uses AWS-SDK. Visit the following page for details on how to configure AWS-SDK:
 *    http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
 *
 * You can also manually configure it using the `config` object.
 */
atomicCounter.config.update({ region: 'us-east-1' });

/**
 * This function demonstrates how to use the success, error, and complete callbacks.
 */
exports[ 'Callbacks in options object' ] = function (test) {
	test.expect( 2 );

	atomicCounter.increment('Users', {
		success: function (value) {
			usersLastValue = value;
			test.ok( true ); // success was executed
		},
		error: function (error) {
			test.ok( false, 'Increment operation failed: ' + JSON.stringify( error ) );
		},
		complete: function (valueOrError) {
			test.ok( true ); // complete was executed
			test.done();
		}
	});
};

/**
 * This function demonstrates how to attach done, fail, and always callbacks to the promise returned by `atomicCounter.increment`.
 */
exports[ 'Callbacks attached to promise' ] = function (test) {
	test.expect( 3 );

	atomicCounter.increment( 'Users' ).done(function (value) {
		var expected = usersLastValue + 1;

		test.ok( true ); // success was executed
		test.strictEqual( value, expected, 'Expected increment value: ' + expected + ' - Actual increment value: ' + value );
	}).fail(function (error) {
		test.ok( false, 'Increment operation failed: ' + JSON.stringify( error ) );
	}).always(function (valueOrError) {
		test.ok( true ); // complete was executed
		test.done();
	});
};

/**
 * This function demonstrates how to overwrite default options.
 */
exports[ 'Overwrite defaults' ] = function (test) {
	var context = {};
	test.expect( 5 );

	atomicCounter.increment('Pages', {
		increment: 12, // Increment counter by 12
		tableName: 'MyCounters', // Use the table "MyCounters", instead of the default "AtomicCounters"
		keyAttribute: 'name', // Use "name" as the identifier attribute of the counter
		countAttribute: 'lastIncrementedValue', // Store the incremented value in an attribute named "lastIncrementedValue"
		context: context // Specify the context for ALL callbacks
	}).done(function (value) {
		test.ok( true ); // done was executed
		test.strictEqual( this, context, 'Wrong context object.' );
		test.equal( value % 12, 0, 'Did not increment the counter by the specified value. Value received: ' + value );
	}).fail(function (error) {
		test.ok( false, 'Increment operation failed: ' + JSON.stringify( error ) );
	}).always(function (valueOrError) {
		test.ok( true ); // always was executed
		test.strictEqual( this, context, 'Wrong context object.' );
		test.done();
	});
};

/**
 * This function tests sending multiple concurrent requests.
 */
exports[ 'Concurrent increments/requests' ] = function (test) {
	var i,
		total = 10,
		promises = [];

	test.expect( 4 );

	for ( i = 0; i < total; i++ ) {
		promises.push( atomicCounter.increment( 'Clients' ) );
	}

	_.when( promises ).done(function() {
		var values = _.toArray( arguments ),
			uniqueValues = _.unique( values );

		test.ok( true ); // done was executed
		test.equal( values.length, total, 'Expected to receive ' + total + ' but received ' + values.length + '.' );
		test.equal( values.length, uniqueValues.length, ( values.length - uniqueValues.length ) + ' duplicate value(s) received.' );
	}).fail(function () {
		test.ok( false, 'One, or more, increment operation(s) failed: ' + JSON.stringify( arguments ) );
	}).always(function() {
		test.ok( true ); // always was executed
		test.done();
	});
};