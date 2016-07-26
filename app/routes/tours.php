<?php
	use \Psr\Http\Message\ServerRequestInterface as Request;
	use \Psr\Http\Message\ResponseInterface as Response;

	require __DIR__.'/../lib/db/db_tours.php';
	require __DIR__.'/../lib/utilities/util.php';

	// Tour Creation
	$app->post('/tours/create', function (Request $request, Response $response) {
		$details = $request->getParsedBody();

	    // Validate the inputs
		$name = validateName($details['name']);
		$description = validateText($details['description']);
		$services = validateServices($details['services']);
		$price = validatePrice($details['price']);
		$numofguests = validateNumOfGuests($details['numofguests']);
		$places = $details['places'];

		// Get the user id
		$token = $this->jwt;
		$userid = $token->data->id;

		// Upload the picture
		$pic_name = "";
		if(isset($_FILES['file'])) {
			$picture = $_FILES['file']; // Need to replace with upload result
			$pic_name = fileUpload($picture);
			if($pic_name === false) {
				$problem = "Your picture could not be uploaded.";
				$pic_name = "";
			}
		}

		// Insert the tour into the database
		$result = createTour($userid, $name, $pic_name, $description, $services, $price, $numofguests, $places);
		return $response->write(print_r($result));
	});
?>