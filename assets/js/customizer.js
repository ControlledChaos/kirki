/**
 * KIRKI CONTROL: CHECKBOX
 */
wp.customize.controlConstructor['kirki-checkbox'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;

		// Get the initial value
		var checkbox_value = control.setting._value;

		this.container.on( 'change', 'input', function() {
			checkbox_value = ( jQuery( this ).is( ':checked' ) ) ? true : false;
			control.setting.set( checkbox_value );
		});
	}
});
/**
 * KIRKI CONTROL: CODE
 */
jQuery( document ).ready( function($) {
	$( 'textarea[data-editor]' ).each( function () {
		var textarea = $( this );
		var mode     = textarea.data( 'editor' );
		var editDiv  = $( '<div>', {
			position: 'absolute',
			width: textarea.width(),
			height: textarea.height(),
			'class': textarea.attr( 'class' )
		}).insertBefore( textarea );
		textarea.css( 'display', 'none' );
		var editor = ace.edit( editDiv[0] );
		editor.renderer.setShowGutter( false );
		editor.renderer.setPadding(10);
		editor.getSession().setValue( textarea.val() );
		editor.getSession().setMode( "ace/mode/" + mode );
		editor.setTheme( "ace/theme/" + textarea.data( 'theme' ) );

		editor.getSession().on( 'change', function(){
			textarea.val( editor.getSession().getValue() ).trigger( 'change' );
		});
	});
});

wp.customize.controlConstructor['code'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;
		this.container.on( 'change', 'textarea', function() {
			control.setting.set( jQuery( this ).val() );
		});
	}
});
/**
 * KIRKI CONTROL: COLOR-ALPHA
 */
jQuery(document).ready(function($) {

	if ( typeof Color !== "undefined" ) {

		Color.prototype.toString = function(remove_alpha) {
			if (remove_alpha == 'no-alpha') {
				return this.toCSS('rgba', '1').replace(/\s+/g, '');
			}
			if (this._alpha < 1) {
				return this.toCSS('rgba', this._alpha).replace(/\s+/g, '');
			}
			var hex = parseInt(this._color, 10).toString(16);
			if (this.error) return '';
			if (hex.length < 6) {
				for (var i = 6 - hex.length - 1; i >= 0; i--) {
					hex = '0' + hex;
				}
			}
			return '#' + hex;
		};

		$('.kirki-color-control').each(function() {
			var $control = $(this),
				value = $control.val().replace(/\s+/g, '');
			// Manage Palettes
			var palette_input = $control.attr('data-palette');
			if (palette_input == 'false' || palette_input == false) {
				var palette = false;
			} else if (palette_input == 'true' || palette_input == true) {
				var palette = true;
			} else {
				var palette = $control.attr('data-palette').split(",");
			}
			$control.wpColorPicker({ // change some things with the color picker
				clear: function(event, ui) {
					// TODO reset Alpha Slider to 100
				},
				change: function(event, ui) {
					// send ajax request to wp.customizer to enable Save & Publish button
					var _new_value = $control.val();
					var key = $control.attr('data-customize-setting-link');
					wp.customize(key, function(obj) {
						obj.set(_new_value);
					});
					// change the background color of our transparency container whenever a color is updated
					var $transparency = $control.parents('.wp-picker-container:first').find('.transparency');
					// we only want to show the color at 100% alpha
					$transparency.css('backgroundColor', ui.color.toString('no-alpha'));
				},
				palettes: palette // remove the color palettes
			});
			$('<div class="kirki-alpha-container"><div class="slider-alpha"></div><div class="transparency"></div></div>').appendTo($control.parents('.wp-picker-container'));
			var $alpha_slider = $control.parents('.wp-picker-container:first').find('.slider-alpha');
			// if in format RGBA - grab A channel value
			if (value.match(/rgba\(\d+\,\d+\,\d+\,([^\)]+)\)/)) {
				var alpha_val = parseFloat(value.match(/rgba\(\d+\,\d+\,\d+\,([^\)]+)\)/)[1]) * 100;
				var alpha_val = parseInt(alpha_val);
			} else {
				var alpha_val = 100;
			}
			$alpha_slider.slider({
				slide: function(event, ui) {
					$(this).find('.ui-slider-handle').text(ui.value); // show value on slider handle
					// send ajax request to wp.customizer to enable Save & Publish button
					var _new_value = $control.val();
					var key = $control.attr('data-customize-setting-link');
					wp.customize(key, function(obj) {
						obj.set(_new_value);
					});
				},
				create: function(event, ui) {
					var v = $(this).slider('value');
					$(this).find('.ui-slider-handle').text(v + '%');
				},
				value: alpha_val,
				range: "max",
				step: 1,
				min: 1,
				max: 100
			}); // slider
			$alpha_slider.slider().on('slidechange', function(event, ui) {
				var new_alpha_val = parseFloat(ui.value),
					iris = $control.data('a8cIris'),
					color_picker = $control.data('wpWpColorPicker');
				iris._color._alpha = new_alpha_val / 100.0;
				$control.val(iris._color.toString());
				color_picker.toggler.css({
					backgroundColor: $control.val()
				});
				// fix relationship between alpha slider and the 'side slider not updating.
				var get_val = $control.val();
				$($control).wpColorPicker('color', get_val);
			});
		}); // each
	}
});
/**
 * KIRKI CONTROL: DIMENSION
 */
wp.customize.controlConstructor['dimension'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;
		var numeric_value = control.container.find('input[type=number]' ).val();
		var units_value   = control.container.find('select' ).val();

		this.container.on( 'change', 'input', function() {
			numeric_value = jQuery( this ).val();
			control.setting.set( numeric_value + units_value );
		});
		this.container.on( 'change', 'select', function() {
			units_value = jQuery( this ).val();
			control.setting.set( numeric_value + units_value );
		});
	}
});
/**
 * KIRKI CONTROL: EDITOR
 */
(function($) {
	wp.customizerCtrlEditor = {

		init: function() {

			$(window).load(function() {

				$('textarea.wp-editor-area').each(function() {
					var tArea = $(this),
						id = tArea.attr('id'),
						input = $('input[data-customize-setting-link="' + id + '"]'),
						editor = tinyMCE.get(id),
						setChange,
						content;

					if (editor) {
						editor.on('change', function(e) {
							editor.save();
							content = editor.getContent();
							clearTimeout(setChange);
							setChange = setTimeout(function() {
								input.val(content).trigger('change');
							}, 500);
						});
					}

					tArea.css({
						visibility: 'visible'
					}).on('keyup', function() {
						content = tArea.val();
						clearTimeout(setChange);
						setChange = setTimeout(function() {
							input.val(content).trigger('change');
						}, 500);
					});
				});
			});
		}

	};

	wp.customizerCtrlEditor.init();

})(jQuery);
/**
 * KIRKI CONTROL: MULTICHECK
 */
jQuery( document ).ready( function() {
	jQuery( '.customize-control-multicheck input[type="checkbox"]' ).on( 'change', function() {
		checkbox_values = jQuery( this ).parents( '.customize-control' ).find( 'input[type="checkbox"]:checked' ).map(
			function() { return this.value; }
		).get().join( ',' );
		jQuery( this ).parents( '.customize-control' ).find( 'input[type="hidden"]' ).val( checkbox_values ).trigger( 'change' );
	}
); } );
/**
 * KIRKI CONTROL: NUMBER
 */
jQuery(document).ready(function($) {
	"use strict";
	$( ".customize-control-number input[type='number']").number();
});

wp.customize.controlConstructor['number'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;
		this.container.on( 'change', 'input', function() {
			control.setting.set( jQuery( this ).val() );
		});
	}
});
jQuery(document).ready(function($) {
	$( '.customize-control-palette > div' ).buttonset();
});
/**
 * KIRKI CONTROL: RADIO-BUTTONSET
 */
wp.customize.controlConstructor['radio-buttonset'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;
		this.container.on( 'click', 'input', function() {
			control.setting.set( jQuery( this ).val() );
		});
	}
});
/**
 * KIRKI CONTROL: RADIO-IMAGE
 */
wp.customize.controlConstructor['radio-image'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;
		this.container.on( 'click', 'input', function() {
			control.setting.set( jQuery( this ).val() );
		});
	}
});
/**
 * KIRKI CONTROL: RADIO
 */
wp.customize.controlConstructor['kirki-radio'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;
		this.container.on( 'change', 'input', function() {
			control.setting.set( jQuery( this ).val() );
		});
	}
});
/**
 * KIRKI CONTROL: REPEATER
 */
function RepeaterRow( rowIndex, element ) {
    this.rowIndex = rowIndex;
    this.rowNumber = rowIndex + 1;
    this.$el = element;
    this.$dragger = this.$el.find( '.repeater-row-move' );
    this.$minimizer = this.$el.find( '.repeater-row-minimize' );
    this.$remover = this.$el.find( '.repeater-row-remove' );
    this.$number = this.$el.find( '.repeater-row-number' );
    this.$fields = this.$el.find( 'input,select,textarea' );

    var self = this;

    this.$minimizer.on( 'click', function() {
        self.toggleMinimize();
    });

    this.$remover.on( 'click', function() {
        self.remove();
    });

    this.$dragger.on( 'mousedown', function() {
        self.$el.trigger( 'row:start-dragging' );
    });


    this.$el.on( 'keyup change', 'input, select, textarea', function( e ) {
        self.$el.trigger( 'row:update', [ self.getRowIndex(), jQuery( e.target ).data( 'field' ), e.target ] );
    });

    this.renderNumber();

}

RepeaterRow.prototype.getRowIndex = function() {
    return this.rowIndex;
};


RepeaterRow.prototype.getRowNumber = function() {
    return this.rowNumber;
};

RepeaterRow.prototype.setRowNumber = function( rowNumber ) {
    this.rowNumber = rowNumber;
    this.renderNumber();
};

RepeaterRow.prototype.getElement = function() {
    return this.$el;
};

RepeaterRow.prototype.setRowIndex = function( rowIndex ) {
    this.rowIndex = rowIndex;
    this.$el.attr( 'data-row', rowIndex );
    this.$el.data( 'row', rowIndex );
};

RepeaterRow.prototype.toggleMinimize = function() {
    // Store the previous state
    this.$el.toggleClass( 'minimized' );
    this.$minimizer.find( '.repeater-minimize' ).toggleClass( 'dashicons-arrow-up' );
    this.$minimizer.find( '.repeater-minimize').toggleClass( 'dashicons-arrow-down' );
};

RepeaterRow.prototype.minimize = function() {
    this.$el.addClass( 'minimized' );
    this.$minimizer.find( '.repeater-minimize' ).removeClass( 'dashicons-arrow-up' );
    this.$minimizer.find( '.repeater-minimize').addClass( 'dashicons-arrow-down' );
};

RepeaterRow.prototype.remove = function() {
    if ( confirm( "Are you sure?" ) ) {
        this.$el.slideUp( 300, function() {
            jQuery(this).detach();
        });
        this.$el.trigger( 'row:remove', [ this.getRowIndex() ] );
    }
};

RepeaterRow.prototype.renderNumber = function() {
    this.$number.text( this.getRowNumber() );
};

wp.customize.controlConstructor['repeater'] = wp.customize.Control.extend({
    ready: function() {
        var control = this;

        // The current value set in Control Class (set in Kirki_Customize_Repeater_Control::to_json() function)
        var settingValue = this.params.value;

        // The hidden field that keeps the data saved (though we never update it)
        this.settingField = this.container.find('[data-customize-setting-link]').first();

        // Set the field value for the first time, we'll fill it up later
        this.setValue( [], false );

        // The DIV that holds all the rows
        this.repeaterFieldsContainer = control.container.find('.repeater-fields').first();

        // Set number of rows to 0
        this.currentIndex = 0;

        // Save the rows objects
        this.rows = [];


        control.container.on('click', 'button.repeater-add', function (e) {
            e.preventDefault();
            control.addRow();
        });

        /**
         * Function that loads the Mustache template
         */
        this.repeaterTemplate = _.memoize(function () {
            var compiled,
            /*
             * Underscore's default ERB-style templates are incompatible with PHP
             * when asp_tags is enabled, so WordPress uses Mustache-inspired templating syntax.
             *
             * @see trac ticket #22344.
             */
                options = {
                    evaluate: /<#([\s\S]+?)#>/g,
                    interpolate: /\{\{\{([\s\S]+?)\}\}\}/g,
                    escape: /\{\{([^\}]+?)\}\}(?!\})/g,
                    variable: 'data'
                };

            return function (data) {
                compiled = _.template(control.container.find('.customize-control-repeater-content').first().html(), null, options);
                return compiled(data);
            };
        });

        // When we load the control, the fields have not been filled up
        // This is the first time that we create all the rows
        if (settingValue.length) {
            for (var i = 0; i < settingValue.length; i++) {
                control.addRow(settingValue[i]);
            }
        }

        this.repeaterFieldsContainer.sortable({
            handle: ".repeater-row-move",
            update: function( e, ui ) {
                control.sort();
            }
        });

    },



    /**
     * Get the current value of the setting
     *
     * @return Object
     */
    getValue: function() {
        // The setting is saved in JSON
        return JSON.parse( decodeURI( this.setting.get() ) );
    },

    /**
     * Set a new value for the setting
     *
     * @param newValue Object
     * @param refresh If we want to refresh the previewer or not
     */
    setValue: function( newValue, refresh ) {
        this.setting.set( encodeURI( JSON.stringify( newValue ) ) );

        if ( refresh ) {
            // Trigger the change event on the hidden field so
            // previewer refresh the website on Customizer
            this.settingField.trigger('change');
        }
    },

    /**
     * Add a new row to repeater settings based on the structure.
     *
     * @param data (Optional) Object of field => value pairs (undefined if you want to get the default values)
     */
    addRow: function( data ) {
        var control = this,
            i,
            row,

        // The template for the new row (defined on Kirki_Customize_Repeater_Control::render_content() )
            template = control.repeaterTemplate(),

        // Get the current setting value
            settingValue = this.getValue(),

        // Saves the new setting data
            newRowSetting = {},

        // Data to pass to the template
            templateData;

        if ( template ) {

            // The control structure is going to define the new fields
            // We need to clone control.params.fields. Assigning it
            // ould result in a reference assignment.
            templateData = jQuery.extend( true, {}, control.params.fields );

            // But if we have passed data, we'll use the data values instead
            if ( data ) {
                for ( i in data ) {
                    if ( data.hasOwnProperty( i ) && templateData.hasOwnProperty( i ) ) {
                        templateData[i].default = data[i];
                    }
                }
            }

            templateData['index'] = this.currentIndex;
            templateData['ControlId'] = this.id;

            // Append the template content
            template = template( templateData );

            // Create a new row object and append the element
            var newRow = new RepeaterRow(
                control.currentIndex,
                jQuery( template ).appendTo( control.repeaterFieldsContainer )
            );

            newRow.getElement().one( 'row:remove', function( e, rowIndex ) {
                control.deleteRow( rowIndex );
            });

            newRow.getElement().on( 'row:update', function( e, rowIndex, fieldName, element ) {
                control.updateField.call( control, e, rowIndex, fieldName, element );
            });

            newRow.getElement().on( 'row:start-dragging', function() {
                // Minimize all rows
                for ( i in control.rows ) {
                    if ( control.rows.hasOwnProperty( i ) && control.rows[i] ) {
                        control.rows[i].minimize();
                    }
                }
            });

            // Add the row to rows collection
            this.rows[ this.currentIndex ] = newRow;

            for ( i in templateData ) {
                if ( templateData.hasOwnProperty( i ) ) {
                    newRowSetting[ i ] = templateData[i].default;
                }
            }

            settingValue[this.currentIndex] = newRowSetting;
            this.setValue( settingValue, true );

            this.currentIndex++;

        }

    },

    sort: function() {
        var control = this;
        var $rows = this.repeaterFieldsContainer.find( '.repeater-row' );
        var newOrder = [];

        $rows.each( function( i, element ) {
            newOrder.push( jQuery( element ).data( 'row' ) );
        });

        var settings = control.getValue();
        var newRows = [];
        var newSettings = [];
        jQuery.each( newOrder, function( newPosition, oldPosition ) {
            newRows[ newPosition ] = control.rows[ oldPosition ];
            newRows[ newPosition ].setRowIndex( newPosition );
            newRows[ newPosition ].setRowNumber( newPosition + 1 );

            newSettings[ newPosition ] = settings[ oldPosition ];
        });

        control.rows = newRows;
        control.setValue( newSettings );
    },

    /**
     * Delete a row in the repeater setting
     *
     * @param index Position of the row in the complete Setting Array
     */
    deleteRow: function( index ) {
        var currentSettings = this.getValue();

        if ( currentSettings[ index ] ) {
            // Find the row
            var row = this.rows[ index ];
            if ( row ) {
                // The row exists, let's delete it

                // Remove the row settings
                delete currentSettings[index];

                // Remove the row from the rows collection
                delete this.rows[index];

                // Update the new setting values
                this.setValue( currentSettings, true );
            }
        }

        // Remap the row numbers
        var i = 1;
        for ( prop in this.rows ) {
            if ( this.rows.hasOwnProperty( prop ) && this.rows[ prop ] ) {
                this.rows[ prop ].setRowNumber( i );
                i++;
            }
        }
    },

    /**
     * Update a single field inside a row.
     * Triggered when a field has changed
     *
     * @param e Event Object
     */
    updateField: function( e, rowIndex, fieldId, element ) {
        if ( ! this.rows[ rowIndex ] )
            return;

        if ( ! this.params.fields[ fieldId ] )
            return;

        var type = this.params.fields[ fieldId].type;
        var row = this.rows[ rowIndex ];
        var currentSettings = this.getValue();
        element = jQuery( element );

        if (typeof currentSettings[row.getRowIndex()][fieldId] == undefined) {
            return;
        }

        if ( type == 'checkbox' ) {
            currentSettings[row.getRowIndex()][fieldId] = element.is( ':checked' );
        }
        else {
            // Update the settings
            currentSettings[row.getRowIndex()][fieldId] = element.val();
        }

        this.setValue( currentSettings, true );

    }
});
/**
 * KIRKI CONTROL: KIRKI-SELECT
 */
function kirkiArrayToObject( arr ) {
	var rv = {};
	for ( var i = 0; i < arr.length; ++i ) {
		if ( arr[i] !== undefined ) rv[i] = arr[i];
	}
	return rv;
}

wp.customize.controlConstructor['kirki-select'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;

		var element  = this.container.find( 'select' );
		var multiple = parseInt( element.data( 'multiple' ) );

		if ( 1 < multiple ) {
			jQuery( element ).selectize({
				maxItems: multiple,
				plugins: ['remove_button', 'drag_drop']
			});
		} else {
			jQuery( element ).selectize();
		}

		this.container.on( 'change', 'select', function() {
			if ( 1 < multiple ) {
				var select_value = kirkiArrayToObject( jQuery( this ).val() );
			} else {
				var select_value = jQuery( this ).val();
			}
			control.setting.set( select_value );
			console.log( select_value );
		});
	}
});
/**
 * KIRKI CONTROL: SLIDER
 */
jQuery(document).ready(function($) {

	$( 'input[type=range]' ).on( 'mousedown', function() {
		value = $( this ).attr( 'value' );
		$( this ).mousemove(function() {
			value = $( this ).attr( 'value' );
			$( this ).closest( 'label' ).find( '.kirki_range_value .value' ).text( value );
		});
	});

	$( '.kirki-slider-reset' ).click( function () {
		var $this_input   = $( this ).closest( 'label' ).find( 'input' ),
			input_name    = $this_input.data( 'customize-setting-link' ),
			input_default = $this_input.data( 'reset_value' );

		$this_input.val( input_default );
		$this_input.change();
	});

});

wp.customize.controlConstructor['slider'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;
		this.container.on( 'change', 'input', function() {
			control.setting.set( jQuery( this ).val() );
		});
	}
});
/**
 * KIRKI CONTROL: SORTABLE
 */
jQuery(document).ready(function($) {
	"use strict";
	// initialize
	$('.kirki-sortable > ul ~ input').each(function() {
		var value = $(this).val();
		try {
			value = unserialize(value);
		} catch (err) {
			return;
		}
		var ul = $(this).siblings('ul:eq(0)');
		ul.find('li').addClass('invisible').find('i.visibility').toggleClass('dashicons-visibility-faint');
		$.each(value, function(i, val) {
			ul.find('li[data-value=' + val + ']').removeClass('invisible').find('i.visibility').toggleClass('dashicons-visibility-faint');
		});
	});
	$('.kirki-sortable > ul').each(function() {
		$(this).sortable()
			.disableSelection()
			.on("sortstop", function(event, ui) {
				kirkiUpdateSortable(ui.item.parent());
			})
			.find('li').each(function() {
				$(this).find('i.visibility').click(function() {
					$(this).toggleClass('dashicons-visibility-faint').parents('li:eq(0)').toggleClass('invisible');
				});
			})
			.click(function() {
				kirkiUpdateSortable($(this).parents('ul:eq(0)'));
			})
	});

});

function kirkiUpdateSortable(ul) {
	"use strict";
	var $ = jQuery;
	var values = [];
	ul.find('li').each(function() {
		if (!$(this).is('.invisible')) {
			values.push($(this).attr('data-value'));
		}
	});
	ul.siblings('input').eq(0).val(serialize(values)).trigger('change');
}
/**
 * KIRKI CONTROL: SPACING
 */
wp.customize.controlConstructor['spacing'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;
		var compiled_value = {};

		// get initial values and pre-populate the object
		if ( control.container.has( '.top' ).size() ) {
			compiled_value['top'] = control.setting._value['top'];
		}
		if ( control.container.has( '.bottom' ).size() ) {
			compiled_value['bottom'] = control.setting._value['bottom'];
		}
		if ( control.container.has( '.left' ).size() ) {
			compiled_value['left']  = control.setting._value['left'];
		}
		if ( control.container.has( '.right' ).size() ) {
			compiled_value['right']    = control.setting._value['right'];
		}

		// top
		if ( control.container.has( '.top' ).size() ) {
			var top_numeric_value = control.container.find('.top input[type=number]' ).val();
			var top_units_value   = control.container.find('.top select' ).val();

			this.container.on( 'change', '.top input', function() {
				top_numeric_value = jQuery( this ).val();
				compiled_value['top'] = top_numeric_value + top_units_value;
				control.setting.set( compiled_value );
			});
			this.container.on( 'change', '.top select', function() {
				top_units_value = jQuery( this ).val();
				compiled_value['top'] = top_numeric_value + top_units_value;
				control.setting.set( compiled_value );
			});
		}

		// bottom
		if ( control.container.has( '.bottom' ).size() ) {
			var bottom_numeric_value = control.container.find('.bottom input[type=number]' ).val();
			var bottom_units_value   = control.container.find('.bottom select' ).val();

			this.container.on( 'change', '.bottom input', function() {
				bottom_numeric_value = jQuery( this ).val();
				compiled_value['bottom'] = bottom_numeric_value + bottom_units_value;
				control.setting.set( compiled_value );
			});
			this.container.on( 'change', '.bottom select', function() {
				bottom_units_value = jQuery( this ).val();
				compiled_value['bottom'] = bottom_numeric_value + bottom_units_value;
				control.setting.set( compiled_value );
			});
		}

		// left
		if ( control.container.has( '.left' ).size() ) {
			var left_numeric_value = control.container.find('.left input[type=number]' ).val();
			var left_units_value   = control.container.find('.left select' ).val();

			this.container.on( 'change', '.left input', function() {
				left_numeric_value = jQuery( this ).val();
				compiled_value['left'] = left_numeric_value + left_units_value;
				control.setting.set( compiled_value );
			});
			this.container.on( 'change', '.left select', function() {
				left_units_value = jQuery( this ).val();
				compiled_value['left'] = left_numeric_value + left_units_value;
				control.setting.set( compiled_value );
			});
		}

		// right
		if ( control.container.has( '.right' ).size() ) {
			var right_numeric_value = control.container.find('.right input[type=number]' ).val();
			var right_units_value   = control.container.find('.right select' ).val();

			this.container.on( 'change', '.right input', function() {
				right_numeric_value = jQuery( this ).val();
				compiled_value['right'] = right_numeric_value + right_units_value;
				control.setting.set( compiled_value );
			});
			this.container.on( 'change', '.right select', function() {
				right_units_value = jQuery( this ).val();
				compiled_value['right'] = right_numeric_value + right_units_value;
				control.setting.set( compiled_value );
			});
		}
	}
});
/**
 * KIRKI CONTROL: SWITCH
 */
wp.customize.controlConstructor['switch'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;

		// Get the initial value
		var checkbox_value = control.setting._value;

		this.container.on( 'change', 'input', function() {
			checkbox_value = ( jQuery( this ).is( ':checked' ) ) ? true : false;
			control.setting.set( checkbox_value );
		});
	}
});
/**
 * KIRKI CONTROL: TOGGLE
 */
wp.customize.controlConstructor['toggle'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;

		// Get the initial value
		var checkbox_value = control.setting._value;

		this.container.on( 'change', 'input', function() {
			checkbox_value = ( jQuery( this ).is( ':checked' ) ) ? true : false;
			control.setting.set( checkbox_value );
		});
	}
});
/**
 * KIRKI CONTROL: TYPOGRAPHY
 */
wp.customize.controlConstructor['typography'] = wp.customize.Control.extend( {
	ready: function() {
		var control = this;
		var compiled_value = {};

		// get initial values and pre-populate the object
		if ( control.container.has( '.bold' ).size() ) {
			compiled_value['bold']           = control.setting._value['bold'];
		}
		if ( control.container.has( '.italic' ).size() ) {
			compiled_value['italic']         = control.setting._value['italic'];
		}
		if ( control.container.has( '.underline' ).size() ) {
			compiled_value['underline']      = control.setting._value['underline'];
		}
		if ( control.container.has( '.strikethrough' ).size() ) {
			compiled_value['strikethrough']  = control.setting._value['strikethrough'];
		}
		if ( control.container.has( '.font-family' ).size() ) {
			compiled_value['font-family']    = control.setting._value['font-family'];
		}
		if ( control.container.has( '.font-size' ).size() ) {
			compiled_value['font-size']      = control.setting._value['font-size'];
		}
		if ( control.container.has( '.font-weight' ).size() ) {
			compiled_value['font-weight']    = control.setting._value['font-weight'];
		}
		if ( control.container.has( '.line-height' ).size() ) {
			compiled_value['line-height']    = control.setting._value['line-height'];
		}
		if ( control.container.has( '.letter-spacing' ).size() ) {
			compiled_value['letter-spacing'] = control.setting._value['letter-spacing'];
		}

		// bold
		if ( control.container.has( '.bold' ).size() ) {
			this.container.on( 'change', '.bold input', function() {
				if ( jQuery( this ).is( ':checked' ) ) {
					compiled_value['bold'] = true;
				} else {
					compiled_value['bold'] = false;
				}
				control.setting.set( compiled_value );
			});
		}

		// italic
		if ( control.container.has( '.italic' ).size() ) {
			this.container.on( 'change', '.italic input', function() {
				if ( jQuery( this ).is( ':checked' ) ) {
					compiled_value['italic'] = true;
				} else {
					compiled_value['italic'] = false;
				}
				control.setting.set( compiled_value );
			});
		}

		// underline
		if ( control.container.has( '.underline' ).size() ) {
			this.container.on( 'change', '.underline input', function() {
				if ( jQuery( this ).is( ':checked' ) ) {
					compiled_value['underline'] = true;
				} else {
					compiled_value['underline'] = false;
				}
				control.setting.set( compiled_value );
			});
		}

		// strikethrough
		if ( control.container.has( '.strikethrough' ).size() ) {
			this.container.on( 'change', '.strikethrough input', function() {
				if ( jQuery( this ).is( ':checked' ) ) {
					compiled_value['strikethrough'] = true;
				} else {
					compiled_value['strikethrough'] = false;
				}
				control.setting.set( compiled_value );
			});
		}

		// font-family
		if ( control.container.has( '.font-family' ).size() ) {
			this.container.on( 'change', '.font-family select', function() {
				compiled_value['font-family'] = jQuery( this ).val();
				control.setting.set( compiled_value );
			});
		}

		// font-size
		if ( control.container.has( '.font-size' ).size() ) {
			var font_size_numeric_value = control.container.find('.font-size input[type=number]' ).val();
			var font_size_units_value   = control.container.find('.font-size select' ).val();

			this.container.on( 'change', '.font-size input', function() {
				font_size_numeric_value = jQuery( this ).val();
				compiled_value['font-size'] = font_size_numeric_value + font_size_units_value;
				control.setting.set( compiled_value );
			});
			this.container.on( 'change', '.font-size select', function() {
				font_size_units_value = jQuery( this ).val();
				compiled_value['font-size'] = font_size_numeric_value + font_size_units_value;
				control.setting.set( compiled_value );
			});
		}

		// font-weight
		if ( control.container.has( '.font-weight' ).size() ) {
			this.container.on( 'change', '.font-weight select', function() {
				compiled_value['font-weight'] = jQuery( this ).val();
				control.setting.set( compiled_value );
			});
		}

		// line-height
		if ( control.container.has( '.line-height' ).size() ) {
			this.container.on( 'change', '.line-height input', function() {
				compiled_value['line-height'] = jQuery( this ).val();
				control.setting.set( compiled_value );
			});
		}

		// letter-spacing
		if ( control.container.has( '.letter-spacing' ).size() ) {
			var letter_spacing_numeric_value = control.container.find('.letter-spacing input[type=number]' ).val();
			var letter_spacing_units_value   = control.container.find('.letter-spacing select' ).val();

			this.container.on( 'change', '.letter-spacing input', function() {
				letter_spacing_numeric_value = jQuery( this ).val();
				compiled_value['letter-spacing'] = letter_spacing_numeric_value + letter_spacing_units_value;
				control.setting.set( compiled_value );
			});
			this.container.on( 'change', '.letter-spacing select', function() {
				letter_spacing_units_value = jQuery( this ).val();
				compiled_value['letter-spacing'] = letter_spacing_numeric_value + letter_spacing_units_value;
				control.setting.set( compiled_value );
			});
		}

	}
});
